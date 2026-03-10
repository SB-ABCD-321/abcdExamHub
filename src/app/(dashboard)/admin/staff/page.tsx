import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { redirect } from "next/navigation";

export default async function AdminStaffPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "ADMIN") return <div>Unauthorized</div>;

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
        include: { teachers: true }
    });

    if (!workspace) return <div>Create a workspace first.</div>;

    async function appointTeacher(formData: FormData) {
        "use server";

        const email = formData.get("email") as string;
        if (!email) return;

        // Find the user by their Clerk email
        const teacherUser = await db.user.findUnique({ where: { email } });

        if (teacherUser) {
            // Connect them to this workspace as a teacher, and upgrade their platform role to TEACHER
            await db.workspace.update({
                where: { id: workspace!.id },
                data: {
                    teachers: { connect: { id: teacherUser.id } }
                }
            });

            await db.user.update({
                where: { id: teacherUser.id },
                data: { role: "TEACHER" }
            });
        }

        revalidatePath("/admin/staff");
    }

    async function removeTeacher(teacherId: string) {
        "use server";
        await db.workspace.update({
            where: { id: workspace!.id },
            data: {
                teachers: { disconnect: { id: teacherId } }
            }
        });

        // Optionally reset them to Student if they belong to no other workspaces as teacher.
        const updatedTeacher = await db.user.findUnique({
            where: { id: teacherId },
            include: { teacherWorkspaces: true }
        });

        if (updatedTeacher && updatedTeacher.teacherWorkspaces.length === 0) {
            await db.user.update({ where: { id: teacherId }, data: { role: "STUDENT" } });
        }

        revalidatePath("/admin/staff");
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Manage Staff & Teachers</h1>
                <p className="text-muted-foreground">Appoint educators to your institute by their registered email address.</p>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Invite a Teacher</CardTitle>
                    <CardDescription>The user must already be signed up on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={appointTeacher} className="flex gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="email">Teacher Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="educator@example.com" required />
                        </div>
                        <Button type="submit">Appoint</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="border rounded-xl shadow-sm bg-card mt-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher Name</TableHead>
                            <TableHead>Email Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workspace.teachers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No teachers appointed yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            workspace.teachers.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="font-medium">
                                        {teacher.firstName} {teacher.lastName}
                                    </TableCell>
                                    <TableCell>{teacher.email}</TableCell>
                                    <TableCell className="text-right">
                                        <form action={removeTeacher.bind(null, teacher.id)}>
                                            <Button variant="destructive" size="sm" type="submit">
                                                Revoke Staff Access
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
