const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Data Mapping (Force Adding INTERESTED) ---');

  try {
    // Step 1: Force add the value to the Postgres Enum type if it doesn't exist
    // Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction in Postgres
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Stage" ADD VALUE 'INTERESTED'`);
      console.log("Registered 'INTERESTED' in database enum TYPE.");
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log("'INTERESTED' was already registered.");
      } else {
        throw e;
      }
    }

    // Step 2: Update the leads
    const result = await prisma.$executeRaw`
      UPDATE "Lead" 
      SET stage = 'INTERESTED' 
      WHERE stage IN ('QUALIFIED', 'PROPOSAL')
    `;

    console.log(`Success! Updated ${result} leads to 'INTERESTED'.`);
  } catch (error) {
    console.error('Error during data mapping:', error);
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
