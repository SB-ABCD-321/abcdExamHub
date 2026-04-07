import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const exams = await prisma.exam.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        accessType: true,
        isPublic: true,
        password: true
      }
    });
    console.log('---BEGIN_EXAM_LIST---');
    console.log(JSON.stringify(exams, null, 2));
    console.log('---END_EXAM_LIST---');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
