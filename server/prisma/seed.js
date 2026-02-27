const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 0. Create Organizations (tenants)
    const demoOrg = await prisma.organization.upsert({
        where: { slug: 'demo' },
        update: { name: 'Demo Company' },
        create: { name: 'Demo Company', slug: 'demo' },
    });

    const acmeOrg = await prisma.organization.upsert({
        where: { slug: 'acme' },
        update: { name: 'Acme Logistics' },
        create: { name: 'Acme Logistics', slug: 'acme' },
    });

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const passwords = {
        admin: await bcrypt.hash('admin123', salt),
        manager: await bcrypt.hash('manager123', salt),
        sales: await bcrypt.hash('sales123', salt),
    };

    const demoAdmin = await prisma.user.upsert({
        where: { organizationId_email: { organizationId: demoOrg.id, email: 'admin@crm.com' } },
        update: { password: passwords.admin, role: 'ADMIN', name: 'System Admin' },
        create: {
            organizationId: demoOrg.id,
            name: 'System Admin',
            email: 'admin@crm.com',
            password: passwords.admin,
            role: 'ADMIN',
        },
    });

    const demoManager = await prisma.user.upsert({
        where: { organizationId_email: { organizationId: demoOrg.id, email: 'manager@crm.com' } },
        update: { password: passwords.manager, role: 'MANAGER', name: 'Sales Manager' },
        create: {
            organizationId: demoOrg.id,
            name: 'Sales Manager',
            email: 'manager@crm.com',
            password: passwords.manager,
            role: 'MANAGER',
        },
    });

    const demoSales = await prisma.user.upsert({
        where: { organizationId_email: { organizationId: demoOrg.id, email: 'sales@crm.com' } },
        update: { password: passwords.sales, role: 'SALES', name: 'Sales Rep' },
        create: {
            organizationId: demoOrg.id,
            name: 'Sales Rep',
            email: 'sales@crm.com',
            password: passwords.sales,
            role: 'SALES',
        },
    });

    // A second tenant to prove isolation (same emails allowed per tenant)
    const acmeAdmin = await prisma.user.upsert({
        where: { organizationId_email: { organizationId: acmeOrg.id, email: 'admin@crm.com' } },
        update: { password: passwords.admin, role: 'ADMIN', name: 'Acme Admin' },
        create: {
            organizationId: acmeOrg.id,
            name: 'Acme Admin',
            email: 'admin@crm.com',
            password: passwords.admin,
            role: 'ADMIN',
        },
    });

    const acmeSales = await prisma.user.upsert({
        where: { organizationId_email: { organizationId: acmeOrg.id, email: 'sales@crm.com' } },
        update: { password: passwords.sales, role: 'SALES', name: 'Acme Sales' },
        create: {
            organizationId: acmeOrg.id,
            name: 'Acme Sales',
            email: 'sales@crm.com',
            password: passwords.sales,
            role: 'SALES',
        },
    });

    console.log(`✅ Users created for demo: ${demoAdmin.email}, ${demoManager.email}, ${demoSales.email}`);
    console.log(`✅ Users created for acme: ${acmeAdmin.email}, ${acmeSales.email}`);

    // 2. Clear dependent data first (FK constraints), then Leads
    // Order matters: Interaction -> Task -> Lead
    await prisma.interaction.deleteMany();
    await prisma.task.deleteMany();
    await prisma.lead.deleteMany();

    const demoLead1 = await prisma.lead.create({
        data: {
            organizationId: demoOrg.id,
            company: 'TechCorp Solutions',
            contactName: 'John Doe',
            email: 'john@techcorp.com',
            phone: '123-456-7890',
            value: 50000,
            priority: 'HIGH',
            stage: 'PROPOSAL',
            leadScore: 85,
            assignedToId: demoSales.id,
            lastInteraction: new Date(),
        },
    });

    const acmeLead1 = await prisma.lead.create({
        data: {
            organizationId: acmeOrg.id,
            company: 'Oceanic Freight',
            contactName: 'Mira Singh',
            email: 'mira@oceanicfreight.com',
            phone: '555-0102',
            value: 72000,
            priority: 'MEDIUM',
            stage: 'QUALIFIED',
            leadScore: 78,
            assignedToId: acmeSales.id,
            lastInteraction: new Date(),
        },
    });

    console.log('✅ Sample leads created (demo + acme)');

    // 3. Create Tasks
    await prisma.task.createMany({
        data: [
            {
                title: 'Follow up call',
                description: 'Discuss proposal details',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: 'HIGH',
                status: 'PENDING',
                leadId: demoLead1.id,
                assignedToId: demoSales.id,
                organizationId: demoOrg.id,
            }
        ],
    });

    await prisma.task.createMany({
        data: [
            {
                title: 'Send pricing sheet',
                description: 'Email updated pricing + delivery SLAs',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                priority: 'MEDIUM',
                status: 'PENDING',
                leadId: acmeLead1.id,
                assignedToId: acmeSales.id,
                organizationId: acmeOrg.id,
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
