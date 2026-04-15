const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');


/**
 * Login Controller
 * Validates credentials against PostgreSQL using Prisma
 * Returns JWT token and user profile
 */
async function login(req, res) {
    try {
        const { email, password, organizationSlug } = req.body;
        const orgSlug = (organizationSlug || 'demo').toString().trim().toLowerCase();
        
        const normalizedEmail = email.trim().toLowerCase();

        const org = await prisma.organization.findUnique({
            where: { slug: orgSlug }
        });

        if (!org) {
            return res.status(404).json({ success: false, error: 'ORG_NOT_FOUND', message: 'Workspace not found' });
        }

        // Find user by org + email (multi-tenant)
        const user = await prisma.user.findUnique({
            where: {
                organizationId_email: {
                    organizationId: org.id,
                    email: normalizedEmail
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'Account not found' });
        }

        // Check password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'INVALID_PASSWORD', message: 'Incorrect password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: org.id,
                organizationSlug: org.slug
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return token and user profile (without password)
        const { password: _, ...userProfile } = user;
        // userProfile.role = userProfile.role.toLowerCase(); // Standardize to raw DB format (uppercase)

        // Fetch team count if manager
        let teamCount = 0;
        if (user.role === 'MANAGER') {
            teamCount = await prisma.user.count({
                where: { managerId: user.id }
            });
        }

        res.json({
            success: true,
            data: {
                token,
                user: {
                    ...userProfile,
                    organizationId: org.id,
                    organizationSlug: org.slug,
                    managerId: user.managerId,
                    hasTeam: teamCount > 0
                }
            }
        });


    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
}

/**
 * Register Controller
 * Creates a new user with hashed password
 */
async function register(req, res) {
    try {
        const { name, email, password, organizationSlug } = req.body;
        const orgSlug = (organizationSlug || 'demo').toString().trim().toLowerCase();

        // Force SALES — public registration cannot self-elevate to ADMIN or MANAGER
        const role = 'SALES';

        if (!orgSlug) {
            return res.status(400).json({ success: false, message: 'Organization is required' });
        }
        
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
        if (!org) return res.status(400).json({ success: false, message: 'Organization not found' });

        // Check if user already exists (per tenant)
        const existingUser = await prisma.user.findUnique({
            where: {
                organizationId_email: {
                    organizationId: org.id,
                    email: normalizedEmail
                }
            }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists in this workspace' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name: trimmedName,
                email: normalizedEmail,
                password: hashedPassword,
                role,
                organizationId: org.id
            }
        });

        const { password: _, ...userProfile } = newUser;
        // userProfile.role = userProfile.role.toLowerCase();

        res.status(201).json({
            success: true,
            data: {
                user: userProfile
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
}

module.exports = {
    login,
    register
};
