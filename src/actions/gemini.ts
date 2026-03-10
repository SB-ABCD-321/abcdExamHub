"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAiQuestionsAction(topicId: string, promptText: string, questionCount: number, base64Pdf?: string) {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (!process.env.GEMINI_API_KEY) {
        return { success: false, error: "Gemini API Key is not configured on the server." };
    }

    try {
        const dbUser = await db.user.findUnique({
            where: { clerkId: userId },
            include: { adminWorkspace: true, teacherWorkspaces: true }
        });

        if (!dbUser) {
            return { success: false, error: "Profile not found." };
        }

        // Verify topic exists and user has access
        const topic = await db.topic.findUnique({
            where: { id: topicId },
            include: { workspace: true }
        });

        if (!topic || !topic.workspace) {
            return { success: false, error: "Topic or Workspace not found." };
        }

        // --- ENFORCE WORKSPACE AUTHORIZATION & IDOR PREVENTION ---
        if (dbUser.role !== "SUPER_ADMIN" && dbUser.id !== topic.workspace.adminId) {
            // Must be explicitly a teacher in this workspace
            const isWorkspaceTeacher = dbUser.teacherWorkspaces.some(w => w.id === topic.workspaceId);
            if (!isWorkspaceTeacher) {
                return { success: false, error: "Unauthorized workspace access" };
            }
        }

        // --- ENFORCE AI TRIAL USAGE LIMITS ---
        if (!topic.workspace.aiUnlimited) {
            // Check workspace limit
            if (topic.workspace.aiGenerationsCount >= topic.workspace.aiLimit) {
                return { success: false, error: "WORKSPACE_LIMIT_REACHED" };
            }

            if (dbUser.role !== "SUPER_ADMIN" && dbUser.id !== topic.workspace.adminId) {
                // Check teacher limit
                let teacherUsage = await db.teacherWorkspaceUsage.findUnique({
                    where: {
                        workspaceId_teacherId: {
                            workspaceId: topic.workspaceId!,
                            teacherId: dbUser.id
                        }
                    }
                });

                // If no record exists, they're allowed the default limit (5) until inserted
                if (teacherUsage && teacherUsage.aiGenerationsCount >= teacherUsage.aiLimit) {
                    return { success: false, error: "TEACHER_LIMIT_REACHED" };
                }
            }
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const systemPromptText = `
You are an expert educational test generator. Generate exactly ${questionCount} multiple choice questions.
Use the provided PDF document as the primary source material if one is attached.
Additional instructions / prompt: "${promptText}".

You MUST return the result ONLY as a raw JSON array of objects. Do not include markdown code blocks or any other surrounding text.

The JSON array must have objects matching this exact structure:
[
  {
    "text": "The actual question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1"
  }
]

CRITICAL RULES:
1. "options" must contain exactly 4 distinct strings.
2. "correctAnswer" MUST be an exact string match to one of the strings inside the "options" array.
3. The response must be a valid JSON array.
        `;

        let promptParts: any[] = [systemPromptText];

        if (base64Pdf) {
            // Remove potential data URL prefix if sent from client (e.g. "data:application/pdf;base64,JVBERi...")
            const base64Data = base64Pdf.includes(",") ? base64Pdf.split(",")[1] : base64Pdf;

            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            });
        }

        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        let generatedQuestions = [];
        try {
            // Attempt to parse the response as JSON
            generatedQuestions = JSON.parse(responseText.trim());
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", responseText);

            // Fallback: Sometimes Gemini still wraps JSON in markdown block despite responseMimeType
            const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                generatedQuestions = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error("AI returned invalid data format.");
            }
        }

        if (!Array.isArray(generatedQuestions)) {
            throw new Error("AI did not return an array.");
        }

        // Map the structured data to Prisma creation payloads
        const creationPayloads = generatedQuestions.map((q: any) => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            topicId: topicId,
            workspaceId: topic.workspaceId,
            isPublic: false,
            authorId: dbUser.id
        }));

        // Batch insert the generated questions and increment AI quota usage within a transaction
        const transactions: any[] = [
            db.question.createMany({
                data: creationPayloads
            }),
            db.workspace.update({
                where: { id: topic.workspaceId! },
                data: { aiGenerationsCount: { increment: 1 } }
            })
        ];

        if (dbUser.role !== "SUPER_ADMIN" && dbUser.id !== topic.workspace.adminId) {
            transactions.push(
                db.teacherWorkspaceUsage.upsert({
                    where: {
                        workspaceId_teacherId: {
                            workspaceId: topic.workspaceId!,
                            teacherId: dbUser.id
                        }
                    },
                    update: { aiGenerationsCount: { increment: 1 } },
                    create: {
                        workspaceId: topic.workspaceId!,
                        teacherId: dbUser.id,
                        aiGenerationsCount: 1, // first generation
                    }
                })
            );
        }

        await db.$transaction(transactions);

        revalidatePath("/teacher/questions");
        return { success: true, count: generatedQuestions.length };

    } catch (error: any) {
        console.error("AI Generation Error:", error);

        let errorMessage = error.message || "Failed to generate questions.";

        // Handle Gemini API Key / 403 Forbidden specifically
        if (error.status === 403 || errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("API_KEY_INVALID")) {
            errorMessage = "Google Gemini rejected the request (403). Your GEMINI_API_KEY is invalid or missing.";
        }

        return { success: false, error: errorMessage };
    }
}
