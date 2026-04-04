const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { validateAuthBody, normalizeEmail } = require('../utils/validation');

/**
 * Login Controller
 * Validates credentials against PostgreSQL using Prisma
 * Returns JWT token and user profile
 */
async function login(req, res) {
    try {
        const { email, password, organizationSlug } = req.body;
        const orgSlug = (organizationSlug || 'demo').toString().trim().toLowerCase();

        // Validate input
        if (!orgSlug) {
            return res.status(400).json({ error: 'Workspace ID is required' });
        }
        const { errors, isValid } = validateAuthBody({ email, password }, false);
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            return res.status(400).json({ error: firstError, errors });
        }
        const normalizedEmail = normalizeEmail(email);

        const org = await prisma.organization.findUnique({
            where: { slug: orgSlug }
        });

        if (!org) {
            return res.status(401).json({ error: 'Workspace not found' });
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
            return res.status(401).json({ error: 'Account not found' });
        }

        // Check password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
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

        res.json({
            success: true,
            token,
            user: {
                ...userProfile,
                organizationId: org.id,
                organizationSlug: org.slug
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

/**
 * Register Controller
 * Creates a new user with hashed password
 */
async function register(req, res) {
    try {
        const { name, email, password, role, organizationSlug } = req.body;
        const orgSlug = (organizationSlug || 'demo').toString().trim().toLowerCase();

        if (!orgSlug || !role) {
            return res.status(400).json({ error: 'Organization and role are required' });
        }
        const { errors, isValid } = validateAuthBody({ name, email, password }, true);
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            return res.status(400).json({ error: firstError, errors });
        }
        const normalizedEmail = normalizeEmail(email);
        const trimmedName = name.trim();

        const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
        if (!org) return res.status(400).json({ error: 'Organization not found' });

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
            return res.status(400).json({ error: 'An account with this email already exists in this workspace' });
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
            user: userProfile
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

module.exports = {
    login,
    register
};
