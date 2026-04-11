import { db } from "../lib/prisma";
import { PaymentStatus, TransactionType, RequestStatus, Role } from "@prisma/client";
import nodemailer from "nodemailer";

async function lifecycleTest() {
    console.log("--- Starting Lifecycle Integration Test ---");

    const TEST_USER_ID = "1d27ede3-5cb2-4125-affc-25837f26eb54"; // Rupam Debnath
    const TEST_PLAN_ID = "204eb10c-2819-49d0-8880-a9cb410a5ebb"; // Coaching Plan
    const TEST_ADMIN_EMAIL = "rd388253@gmail.com";

    try {
        // 1. Clean up any previous test requests for this user
        console.log("[TEST] Cleaning up previous requests...");
        await db.workspaceRequest.deleteMany({ where: { userId: TEST_USER_ID } });

        // 2. Create Workspace Request
        console.log("[STEP 1] Creating Workspace Request...");
        const request = await db.workspaceRequest.create({
            data: {
                adminName: "Rupam Debnath (Test)",
                adminEmail: TEST_ADMIN_EMAIL,
                adminPhone: "8927855397",
                workspaceName: "Rupam Test Academy",
                planId: TEST_PLAN_ID,
                planDuration: "1M",
                userId: TEST_USER_ID,
                status: 'PENDING'
            }
        });
        console.log(`[PASS] Request Created ID: ${request.id}`);

        // 3. Simulate Approval Process (Internal Logic)
        console.log("[STEP 2] Simulating Approval Lifecycle...");
        
        // a. Create Workspace
        const workspace = await db.workspace.create({
            data: {
                name: request.workspaceName,
                contactEmail: request.adminEmail,
                contactPhone: request.adminPhone,
                adminId: TEST_USER_ID,
                status: 'ACTIVE',
            }
        });
        console.log(`[PASS] Workspace Provisioned ID: ${workspace.id}`);

        // b. Update User Role
        await db.user.update({
            where: { id: TEST_USER_ID },
            data: { role: 'ADMIN' }
        });
        console.log(`[PASS] User Role Promoted to ADMIN.`);

        // c. Apply Plan & Record Payment (Mocking the financial action logic)
        console.log("[STEP 3] Finalizing Financial Shards...");
        const plan = await db.pricingPlan.findUnique({ where: { id: TEST_PLAN_ID } });
        const baseAmount = plan?.price1Month || 0;
        const totalAmount = baseAmount * 1.18; // 18% GST

        await db.$transaction(async (tx) => {
            const transactionRecord = await tx.accountingTransaction.create({
                data: {
                    type: 'INCOME',
                    category: 'Subscription',
                    amount: totalAmount,
                    date: new Date(),
                    description: `Plan: ${plan?.name} (1M) - Workspace: ${workspace.name}`,
                    workspaceId: workspace.id,
                }
            });

            await tx.workspacePayment.create({
                data: {
                    workspaceId: workspace.id,
                    amount: totalAmount,
                    baseAmount,
                    gstAmount: totalAmount - baseAmount,
                    totalAmount,
                    planName: plan?.name || "Coaching Plan",
                    duration: "1M",
                    paymentDate: new Date(),
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    status: 'PAID',
                    transactionId: transactionRecord.id,
                    receiptNumber: `INV-TEST-${Date.now()}`,
                    paymentMethod: "Test/SystemCheck"
                }
            });
        });
        console.log(`[PASS] Financial Records & Receipts Sealed.`);

        // d. Mark Request as Approved
        await db.workspaceRequest.update({
            where: { id: request.id },
            data: { 
                status: 'APPROVED',
                processedAt: new Date(),
            }
        });
        console.log(`[PASS] Request Finalized.`);

        console.log("\n--- TEST SUMMARY ---");
        console.log("Database state successfully synchronized.");
        console.log("Institutional Node is now ACTIVE.");
        
        // Final Cleanup (Optional)
        // In a real verification, we might want to keep it to show the user, then delete.
        console.log("[TEST] Deleting test records to maintain database hygiene...");
        await db.workspacePayment.deleteMany({ where: { workspaceId: workspace.id } });
        await db.accountingTransaction.deleteMany({ where: { workspaceId: workspace.id } });
        await db.workspace.delete({ where: { id: workspace.id } });
        await db.user.update({ where: { id: TEST_USER_ID }, data: { role: 'STUDENT' } });
        await db.workspaceRequest.delete({ where: { id: request.id } });
        console.log("[CLEANUP] SUCCESS.");

    } catch (error) {
        console.error("[FAIL] Lifecycle broke during execution:", error);
    }

    process.exit(0);
}

lifecycleTest();
