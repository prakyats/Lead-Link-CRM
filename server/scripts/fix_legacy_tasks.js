const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLegacyTasks() {
  try {
    console.log('Initializing legacy task accountability...');
    const result = await prisma.task.updateMany({
      where: { createdById: null },
      data: {
        // Since we can't use a field reference in updateMany for Prisma currently,
        // we'll fetch then update individually or use raw SQL.
        // Raw SQL is cleaner here.
      }
    });
    
    // Using raw SQL for field-to-field update
    const count = await prisma.$executeRaw`UPDATE "Task" SET "createdById" = "assignedToId" WHERE "createdById" IS NULL`;
    
    console.log(`Success! Updated ${count} legacy tasks.`);
  } catch (error) {
    console.error('Failed to fix legacy tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLegacyTasks();
