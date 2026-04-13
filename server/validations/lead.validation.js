const { z } = require('zod');

const createLeadSchema = z.object({
    company: z.string().min(1),
    contact: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    value: z.number().nonnegative().optional(),
    stage: z.enum(["NEW", "CONTACTED", "INTERESTED", "CONVERTED", "LOST"]).default("NEW"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    assignedToId: z.number().optional()
});

const updateLeadSchema = createLeadSchema.partial();

module.exports = {
    createLeadSchema,
    updateLeadSchema
};
