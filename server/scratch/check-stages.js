const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const stages = await prisma.$queryRawUnsafe('SELECT DISTINCT stage::text FROM "Lead"');
    console.log('Current stages in DB:', stages);
    
    const enumValues = await prisma.$queryRawUnsafe("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'Stage'");
    console.log('Current Stage enum values in Postgres:', enumValues);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
