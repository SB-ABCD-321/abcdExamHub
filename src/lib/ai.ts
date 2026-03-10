import { GoogleGenAI } from '@google/genai';
import { db } from "@/lib/prisma";

// Initialize the Gemini client using the runtime API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Suggests public mock exams to a user based on their past exam history
 * by analyzing Topic affinities and proposing relevant remaining exams.
 */
export async function suggestMockExamsForStudent(clerkUserId: string) {
    try {
        const dbUser = await db.user.findUnique({
            where: { clerkId: clerkUserId },
            include: { examResults: { include: { exam: { include: { questions: { include: { question: { include: { topic: true } } } } } } } } }
        });

        if (!dbUser || dbUser.examResults.length === 0) {
            // Fallback to latest public exams if no history
            return await db.exam.findMany({ where: { isPublic: true }, take: 3, orderBy: { createdAt: 'desc' } });
        }

        // 1. Gather historical context: topics the user has interacted with
        const historicalTopics = new Set<string>();
        dbUser.examResults.forEach(r => {
            r.exam.questions.forEach(eq => {
                historicalTopics.add(eq.question.topic.name);
            });
        });

        // 2. Get all available public exams they *haven't* taken
        const takenExamIds = dbUser.examResults.map(r => r.examId);
        const availableExams = await db.exam.findMany({
            where: {
                isPublic: true,
                id: { notIn: takenExamIds }
            },
            include: { questions: { include: { question: { include: { topic: true } } } } }
        });

        if (availableExams.length === 0) return [];

        // Prepare AI prompt payload
        const topicsArray = Array.from(historicalTopics).join(", ");
        const availableCatalog = availableExams.map(ex => {
            const topicsInExam = Array.from(new Set(ex.questions.map(q => q.question.topic.name))).join(", ");
            return `ID: ${ex.id} | Title: ${ex.title} | Topics: ${topicsInExam}`;
        }).join("\n");

        const prompt = `
     You are an intelligent educational counselor. 
     A student has previously taken exams related to these topics: ${topicsArray}.
     
     Here is a catalog of available exams they have not taken yet:
     ${availableCatalog}
     
     Recommend up to 3 exam IDs from the catalog that would be most beneficial for them to take next, considering their past interests.
     Return ONLY a JSON array of string IDs, nothing else. Example: ["id1", "id2"]
     `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const outputText = response.text || "[]";
        const recommendedIds: string[] = JSON.parse(outputText.replace(/```json/g, "").replace(/```/g, ""));

        // 3. Fetch full objects for the recommended IDs
        const recommendedExams = await db.exam.findMany({
            where: { id: { in: recommendedIds } },
            include: { _count: { select: { questions: true } }, workspace: true }
        });

        // Fallback if AI fails parsing or logic
        if (recommendedExams.length === 0) {
            return availableExams.slice(0, 3);
        }

        return recommendedExams;

    } catch (error) {
        console.error("Failed to generate AI recommendations:", error);
        // Fallback to recent public exams on failure
        return await db.exam.findMany({ where: { isPublic: true }, take: 3, orderBy: { createdAt: 'desc' } });
    }
}
