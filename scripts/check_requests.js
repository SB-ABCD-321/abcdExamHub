const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkState() {
  const requests = await prisma.workspaceRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- RECENT REQUESTS ---');
  console.table(requests.map(r => ({ id: r.id, name: r.name, email: r.email, status: r.status })));
}

checkState().finally(() => prisma.$disconnect());
