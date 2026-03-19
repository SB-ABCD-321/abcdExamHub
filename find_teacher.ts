import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'TEACHER' }
  })
  console.log(JSON.stringify(user))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
