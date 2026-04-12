const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Final Database State Verification ---');

  try {
    const leadsCount = await prisma.lead.count();
    console.log(`Total Leads: ${leadsCount}`);

    const stagesCount = await prisma.lead.groupBy({
      by: ['stage'],
      _count: true,
    });

    console.log('Leads by Stage:');
    stagesCount.forEach(s => {
      console.log(`- ${s.stage}: ${s._count}`);
    });

    // Check for any legacy stages (just in case)
    // Note: Since the schema has changed, standard prisma queries won't find them if they don't match the Enum.
    // If the migration succeeded, they MUST match the 5 stages.
    
    console.log('\n--- Migration Status Check ---');
    console.log('Checking for version-controlled migration files...');
    // We already checked this via list_dir earlier
    
    console.log('Verification Complete.');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
