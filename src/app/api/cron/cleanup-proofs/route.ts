import { cleanupExpiredPaymentProofs } from "@/actions/financial-actions";
import { NextResponse } from "next/server";

/**
 * Endpoint for Vercel Cron or other schedulers.
 * Cleans up old institutional payment proofs from Cloudinary and DB.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Secure the endpoint
    if (secret !== process.env.CRON_SECRET) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await cleanupExpiredPaymentProofs();
        if (result.success) {
            return NextResponse.json({ 
                message: "Cleanup cycle completed.", 
                processed: result.count 
            }, { status: 200 });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
