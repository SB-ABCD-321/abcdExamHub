import { db } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Plus, Wallet, FileText, Calendar, Filter } from "lucide-react";
import { TransactionTable } from "./transaction-table";
import { TransactionForm } from "./transaction-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default async function SuperAdminAccountingPage() {
    const transactions = await db.accountingTransaction.findMany({
        orderBy: { date: 'desc' },
        include: { workspace: true }
    });

    const income = transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + t.amount, 0);
    const expenses = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + t.amount, 0);
    const balance = income - expenses;

    return (
        <div className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-10 border-b border-slate-100 dark:border-zinc-800">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Financial <span className="text-primary">Control</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">Monitor global transactions, manage manual subscriptions, and oversee platform overhead with absolute precision.</p>
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto overflow-hidden">
                    <Card className="bg-slate-900 border-none rounded-[2rem] shadow-xl shadow-slate-900/20 transition-transform hover:scale-[1.02]">
                        <CardContent className="p-8 text-center sm:text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary mb-1">Total Balance</p>
                            <p className="text-3xl font-black italic tracking-tighter text-white">₹{balance.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-zinc-900 border-none rounded-[2rem] shadow-lg transition-transform hover:scale-[1.02]">
                        <CardContent className="p-8 text-center sm:text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-1">Income</p>
                            <p className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">₹{income.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-zinc-900 border-none rounded-[2rem] shadow-lg transition-transform hover:scale-[1.02]">
                        <CardContent className="p-8 text-center sm:text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mb-1">Expenses</p>
                            <p className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">₹{expenses.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                {/* Left Side: Forms */}
                <div className="lg:col-span-1 space-y-10 order-2 lg:order-1">
                    <Card className="bg-white dark:bg-zinc-900 border-none shadow-[0_12px_44px_-12px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-950 p-6 md:p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Plus size={40} />
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Post Ledger Entry</CardTitle>
                            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">Log manual income or platform expenses</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10">
                            <TransactionForm />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Table */}
                <div className="lg:col-span-2 space-y-10 order-1 lg:order-2">

                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="h-12 bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl border border-white dark:border-zinc-800 shadow-inner">
                                <TabsTrigger value="all" className="rounded-xl px-6 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 transition-all">All</TabsTrigger>
                                <TabsTrigger value="income" className="rounded-xl px-6 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 text-emerald-600 transition-all">Income</TabsTrigger>
                                <TabsTrigger value="expense" className="rounded-xl px-6 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 text-red-500 transition-all">Expenses</TabsTrigger>
                            </TabsList>
                            <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 font-black uppercase tracking-widest text-[10px] gap-2">
                                <Filter className="w-3.5 h-3.5" /> Export Logs
                            </Button>
                        </div>

                        <TabsContent value="all" className="mt-0">
                             <TransactionTable transactions={JSON.parse(JSON.stringify(transactions))} />
                        </TabsContent>
                        <TabsContent value="income" className="mt-0">
                             <TransactionTable transactions={JSON.parse(JSON.stringify(transactions.filter((t: any) => t.type === 'INCOME')))} />
                        </TabsContent>
                        <TabsContent value="expense" className="mt-0">
                             <TransactionTable transactions={JSON.parse(JSON.stringify(transactions.filter((t: any) => t.type === 'EXPENSE')))} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

