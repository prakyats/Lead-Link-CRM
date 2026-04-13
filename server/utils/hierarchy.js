const prisma = require('./prisma');

/**
 * Returns an array of User IDs that the current user has access to.
 * SALER: [self.id]
 * MANAGER: [self.id, ...direct_reports.id] (If no reports, returns only [self.id])
 * ADMIN: ALL users in the organization
 */
async function getAccessibleUserIds(user) {
    if (!user) return [];
    const userId = parseInt(user.id);
    const organizationId = parseInt(user.organizationId);
    const role = user.role;

    if (role === 'ADMIN') {
        const allUsers = await prisma.user.findMany({
            where: { organizationId },
            select: { id: true }
        });
        return allUsers.map(u => u.id);
    }

    if (role === 'MANAGER') {
        const team = await prisma.user.findMany({
            where: { 
                organizationId,
                managerId: userId 
            },
            select: { id: true }
        });
        
        const teamIds = team.map(u => u.id);
        return [userId, ...teamIds];
    }

    // Default to SALES / self
    return [userId];
}

module.exports = {
    getAccessibleUserIds
};
