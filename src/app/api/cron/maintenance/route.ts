import { runSystemMaintenance } from "@/actions/maintenance";
import { NextResponse } from "next/server";

/**
 * Unified Maintenance Cron Endpoint.
 * Scheduled to run daily to purge old notices, abandoned drafts, and payment proofs.
 * Access restricted via CRON_SECRET.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Security Guard
    if (secret !== process.env.CRON_SECRET) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await runSystemMaintenance();
        if (result.success) {
            return NextResponse.json({ 
                message: "Maintenance cycle completed successfully.", 
                stats: result.stats 
            }, { status: 200 });
        } else {
            return NextResponse.json({ 
                error: result.error 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("MAINTENANCE_API_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
