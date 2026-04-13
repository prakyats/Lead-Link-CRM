const { z } = require('zod');

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    organizationSlug: z.string().min(1).optional()
});

module.exports = {
    loginSchema
};
