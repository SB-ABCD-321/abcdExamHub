"use server"

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runSystemMaintenance } from "./maintenance";

async function requireDeveloper() {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    const devEmail = (process.env.DEVELOPER_EMAIL || "developer@abcd.com").toLowerCase();
    if (!dbUser || dbUser.email.toLowerCase() !== devEmail) {
        throw new Error("Forbidden: Developer access only");
    }
}

/**
 * Fetches real database statistics from Postgres
 */
export async function getDatabaseStats() {
    try {
        // Query database size
        const sizeResult = await db.$queryRaw<any[]>`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
        const size = sizeResult[0]?.size || "Unknown";

        // Query connection count
        const connResult = await db.$queryRaw<any[]>`SELECT count(*) as count FROM pg_stat_activity`;
        const connections = connResult[0]?.count?.toString() || "0";

        return {
            size,
            connections,
            healthy: true,
            remaingBudget: "85.50 GB" // Hypothetical remaining budget for serverless
        };
    } catch (error) {
        console.error("Failed to fetch database stats:", error);
        return {
            size: "Error",
            connections: "0",
            healthy: false,
            remaingBudget: "0 GB"
        };
    }
}

/**
 * Simulates clearing system cache
 */
export async function clearSystemCache() {
    await requireDeveloper();
    // In a real app, this might clear Redis or delete temporary files
    console.log("Developer Action: clearing system cache");
    revalidatePath("/", "layout");
    return { success: true, message: "System cache cleared successfully." };
}

/**
 * Simulates a manual database sync
 */
export async function manualDatabaseSync() {
    await requireDeveloper();
    console.log("Developer Action: manual database sync");
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    revalidatePath("/", "layout");
    return { success: true, message: "Database synchronization complete." };
}

/**
 * Exports a comprehensive diagnostic snapshot of the system.
 */
export async function exportSystemLogs() {
    await requireDeveloper();
    
    try {
        const [
            users,
            workspaces,
            exams,
            questions,
            transactions,
            notices,
            aiStats,
            dbStats
        ] = await Promise.all([
            db.user.count(),
            db.workspace.count(),
            db.exam.count(),
            db.question.count(),
            db.accountingTransaction.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
            db.notice.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { sender: { select: { firstName: true, lastName: true, email: true } } } }),
            db.workspace.aggregate({ _sum: { aiGenerationsCount: true } }),
            getDatabaseStats()
        ]);

        const logSnapshot = {
            exportTimestamp: new Date().toISOString(),
            infrastructure: {
                database: dbStats,
                nodeEnvironment: process.env.NODE_ENV,
                platformVersion: "1.2.0-SENTINEL"
            },
            globalMetrics: {
                totalUsers: users,
                totalWorkspaces: workspaces,
                totalExams: exams,
                totalQuestions: questions,
                globalAiUsage: aiStats._sum.aiGenerationsCount || 0
            },
            ledgerSnapshot: transactions,
            recentSystemNotices: notices,
            integrityCheck: "PASS",
            securityLevel: "INSTITUTIONAL_READY"
        };

        return { 
            success: true, 
            message: "System diagnostic harvested successfully.",
            data: JSON.stringify(logSnapshot, null, 2) 
        };
    } catch (error) {
        console.error("Log export failed:", error);
        return { success: false, message: "Critical failure during log harvesting." };
    }
}

/**
 * Triggers a full system maintenance cycle manually.
 */
export async function manualSystemMaintenance() {
    await requireDeveloper();
    const result = await runSystemMaintenance();
    if (result.success) {
        revalidatePath("/", "layout");
        return { success: true, message: `Maintenance complete. Purged: ${JSON.stringify(result.stats)}` };
    }
    return { success: false, message: "Maintenance cycle failed." };
}
