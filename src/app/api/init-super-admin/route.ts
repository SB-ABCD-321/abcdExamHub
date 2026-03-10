import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await db.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
        // A super admin already exists, so don't allow anyone else to claim it
        if (existingSuperAdmin.clerkId === userId) {
            redirect('/super-admin');
        } else {
            return new Response('Super Admin is already initialized. Access Denied.', { status: 403 });
        }
    }

    // No SUPER_ADMIN exists yet, so make this user the SUPER_ADMIN
    try {
        const user = await currentUser();
        if (!user) {
            return new Response('User not found on Clerk', { status: 404 });
        }

        const primaryEmail = user.emailAddresses?.length > 0 ? user.emailAddresses[0].emailAddress : '';

        // Upsert ensures that if the webhook missed the creation, we still create the user in Neon DB
        await db.user.upsert({
            where: { clerkId: userId },
            update: { role: 'SUPER_ADMIN' },
            create: {
                clerkId: userId,
                email: primaryEmail,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                imageUrl: user.imageUrl || '',
                role: 'SUPER_ADMIN'
            }
        });

        // Redirect to the super admin dashboard
        redirect('/super-admin');
    } catch (error) {
        console.error('Failed to initialize Super Admin:', error);
        return new Response('Failed to initialize Super Admin or User not found in DB', { status: 500 });
    }
}
