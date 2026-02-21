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
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
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
            user: userProfile
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
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
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
                role
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
