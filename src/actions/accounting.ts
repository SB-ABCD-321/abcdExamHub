"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTransaction(data: {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description?: string;
    date?: Date;
    workspaceId?: string;
}) {
    try {
        const transaction = await db.accountingTransaction.create({
            data: {
                ...data,
                date: data.date || new Date(),
            }
        });


        revalidatePath("/super-admin/accounting");
        return { success: true, id: transaction.id };
    } catch (error) {
        console.error("CREATE_TRANSACTION_ERROR", error);
        return { success: false, error: "Failed to record transaction." };
    }
}

export async function getWorkspacePayments(workspaceId: string) {
    try {
        return await db.workspacePayment.findMany({
            where: { workspaceId },
            orderBy: { paymentDate: 'desc' }
        });
    } catch (error) {

        console.error("GET_WORKSPACE_PAYMENTS_ERROR", error);
        return [];
    }
}
