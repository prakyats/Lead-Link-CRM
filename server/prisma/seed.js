const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const passwords = {
        admin: await bcrypt.hash('admin123', salt),
        manager: await bcrypt.hash('manager123', salt),
        sales: await bcrypt.hash('sales123', salt),
    };

    const admin = await prisma.user.upsert({
        where: { email: 'admin@crm.com' },
        update: { password: passwords.admin, role: 'ADMIN' },
        create: {
            name: 'System Admin',
            email: 'admin@crm.com',
            password: passwords.admin,
            role: 'ADMIN',
        },
    });

    const manager = await prisma.user.upsert({
        where: { email: 'manager@crm.com' },
        update: { password: passwords.manager, role: 'MANAGER' },
        create: {
            name: 'Sales Manager',
            email: 'manager@crm.com',
            password: passwords.manager,
            role: 'MANAGER',
        },
    });

    const salesUser = await prisma.user.upsert({
        where: { email: 'sales@crm.com' },
        update: { password: passwords.sales, role: 'SALES' },
        create: {
            name: 'Sales Rep',
            email: 'sales@crm.com',
            password: passwords.sales,
            role: 'SALES',
        },
    });

    console.log(`✅ Users created: ${admin.email}, ${manager.email}, ${salesUser.email}`);

    // 2. Clear and then Create Leads to avoid unique constraints or duplicate conflicts if any
    await prisma.lead.deleteMany();

    const lead1 = await prisma.lead.create({
        data: {
            company: 'TechCorp Solutions',
            contactName: 'John Doe',
            email: 'john@techcorp.com',
            phone: '123-456-7890',
            value: 50000,
            priority: 'HIGH',
            stage: 'PROPOSAL',
            leadScore: 85,
            assignedToId: salesUser.id,
            lastInteraction: new Date(),
        },
    });

    console.log('✅ Sample leads created');

    // 3. Create Tasks
    await prisma.task.deleteMany();
    await prisma.task.createMany({
        data: [
            {
                id: 1,
                title: 'Follow up call',
                description: 'Discuss proposal details',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: 'HIGH',
                status: 'PENDING',
                leadId: lead1.id,
                assignedToId: salesUser.id,
            }
        ],
    });

    console.log('✅ Sample tasks created');
    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
