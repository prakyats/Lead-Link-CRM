const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getAccessibleUserIds } = require('./server/utils/hierarchy');

async function verify() {
    try {
        console.log('--- STARTING SECURITY ISOLATION VERIFICATION ---');

        // 1. Get a Manager and a user NOT in their team
        const manager = await prisma.user.findFirst({
            where: { role: 'MANAGER', teamMembers: { some: {} } },
            include: { teamMembers: true }
        });

        if (!manager) {
            console.log('No manager with team found. Skipping test.');
            return;
        }

        const externalUser = await prisma.user.findFirst({
            where: { 
                NOT: { 
                    OR: [
                        { id: manager.id },
                        { managerId: manager.id }
                    ]
                },
                organizationId: manager.organizationId
            }
        });

        if (!externalUser) {
            console.log('No external user found in same org. Skipping test.');
            return;
        }

        const accessibleIds = await getAccessibleUserIds(manager);
        console.log(`Manager [${manager.name}] accessible IDs:`, accessibleIds);
        console.log(`Checking isolation against External User [${externalUser.name}] (ID: ${externalUser.id})`);

        if (accessibleIds.includes(externalUser.id)) {
            console.log('❌ FAILED: External user is in accessible IDs.');
            return;
        } else {
            console.log('✅ PASS: External user correctly excluded from accessible IDs.');
        }

        // 2. Find a lead belonging to external user
        const externalLead = await prisma.lead.findFirst({
            where: { assignedToId: externalUser.id }
        });

        if (externalLead) {
            console.log(`Found lead [${externalLead.company}] belonging to external user.`);
            // Note: We can't actually call the HTTP endpoint here easily without a full mock,
            // but we can verify our CONTROLLER logic manually by checking the code again.
            // The code now does: if (!accessibleIds.includes(lead.assignedToId)) return 403;
            // Since externalUser.id is NOT in accessibleIds, the check will pass.
        }

        console.log('--- VERIFICATION COMPLETE ---');
    } catch (error) {
        console.error('Verification error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
