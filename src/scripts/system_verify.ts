import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";

async function verifySystem() {
    console.log("--- Starting Mission Readiness Diagnostic ---");

    try {
        console.log("[DB] Verifying Neon Connection...");
        const userCount = await db.user.count();
        const workspaceCount = await db.workspace.count();
        const requestCount = await db.workspaceRequest.count();
        const paymentCount = await db.workspacePayment.count();

        console.log(`[DB] SUCCESS: Connectivity established.`);
        console.log(`[DB] Nodes: ${workspaceCount} | Requisitions: ${requestCount} | Receipts: ${paymentCount} | Units: ${userCount}`);
        
        const plans = await db.pricingPlan.findMany({ where: { isActive: true } });
        console.log(`[DB] ACTIVE PLANS: ${plans.map(p => p.name).join(", ")}`);

    } catch (error) {
        console.error("[DB] FAILURE: Could not connect or query records.", error);
    }

    try {
        console.log("[SMTP] Verifying Brevo Relay Connectivity...");
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
            throw new Error("Missing SMTP credentials in .env");
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });

        const verified = await transporter.verify();
        if (verified) {
            console.log("[SMTP] SUCCESS: Brevo relay is healthy and authenticated.");
        }
    } catch (error) {
        console.error("[SMTP] FAILURE: Relay authentication failed.", error);
    }

    console.log("--- End of Diagnostic ---");
    process.exit(0);
}

verifySystem().catch(e => {
    console.error("CRITICAL_VERIFY_ERROR", e);
    process.exit(1);
});
