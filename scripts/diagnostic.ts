import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkState() {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  const requests = await prisma.workspaceRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- RECENT USERS ---');
  console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  
  console.log('\n--- RECENT REQUESTS ---');
  console.table(requests.map(r => ({ id: r.id, name: r.name, email: r.email, status: r.status })));
}

checkState().finally(() => prisma.$disconnect());
