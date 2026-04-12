const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { validateUserBody, normalizeEmail, sanitizeString } = require('../utils/validation');

/**
 * Get all users (ADMIN only)
 * Returns user list without passwords
 */
async function getAllUsers(req, res) {
    try {
        const { role, organizationId } = req.user;

        if (role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const users = await prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                manager: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });


        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

/**
 * Create user (ADMIN only)
 * Hashes password and stores user via Prisma
 */
async function createUser(req, res) {
    try {
        const { role, id: userId, organizationId } = req.user;

        if (role !== 'ADMIN' && role !== 'MANAGER') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const { name, email, password, role: newUserRole, managerId } = req.body;
        
        // RBAC: Manager can only create SALES
        if (role === 'MANAGER' && newUserRole.toUpperCase() !== 'SALES') {
            return res.status(403).json({ error: 'Managers can only create Sales accounts' });
        }


        // Validate with centralized rules
        const { errors, isValid } = validateUserBody({ name, email, password, role: newUserRole });
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            return res.status(400).json({ error: firstError, errors });
        }

        const sanitizedName = sanitizeString(name);
        const sanitizedEmail = normalizeEmail(email);

        // Check if user already exists in this organization
        const existingUser = await prisma.user.findUnique({
            where: {
                organizationId_email: {
                    organizationId,
                    email: sanitizedEmail
                }
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists in this workspace' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Set Manager ID logic
        let assignedManagerId = null;
        if (role === 'MANAGER') {
            assignedManagerId = userId; // Auto-assign to self
        } else if (role === 'ADMIN' && newUserRole.toUpperCase() === 'SALES') {
            assignedManagerId = managerId ? parseInt(managerId) : null;
        }

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
                role: newUserRole.toUpperCase(),
                organizationId,
                managerId: assignedManagerId
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
}

/**
 * Get sales users in the organization (MANAGER/ADMIN)
 * Used for populating assignee dropdowns
 */
async function getSalesUsers(req, res) {
    try {
        const { role, id: userId, organizationId } = req.user;

        if (role === 'SALES') {
            return res.status(403).json({ error: 'Access denied' });
        }

        let where = { organizationId };
        
        if (role === 'MANAGER') {
            where.role = 'SALES';
            where.managerId = userId;
        } else {
            // ADMIN sees all potential assignees
            where.role = { in: ['SALES', 'MANAGER'] };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });


        res.json(users);
    } catch (error) {
        console.error('Error fetching sales users:', error);
        res.status(500).json({ error: 'Failed to fetch sales users' });
    }
}

module.exports = {
    getAllUsers,
    createUser,
    getSalesUsers
};
