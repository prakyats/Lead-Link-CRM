const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');

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
                createdAt: true
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
        const { role, organizationId } = req.user;

        if (role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const { name, email, password, role: newUserRole } = req.body;

        // Validate required fields
        if (!name || !email || !password || !newUserRole) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }

        // Validate role
        const validRoles = ['ADMIN', 'MANAGER', 'SALES'];
        if (!validRoles.includes(newUserRole.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid role. Must be ADMIN, MANAGER, or SALES' });
        }

        // Check if user already exists in this organization
        const existingUser = await prisma.user.findUnique({
            where: {
                organizationId_email: {
                    organizationId,
                    email
                }
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: newUserRole.toUpperCase(),
                organizationId
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

module.exports = {
    getAllUsers,
    createUser
};
