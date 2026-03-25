import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { title: true, resultPublishMode: true, customPublishDate: true }
  })
  console.log(exams)
}

main()
