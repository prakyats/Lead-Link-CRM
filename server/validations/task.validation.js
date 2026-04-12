const { z } = require('zod');

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    leadId: z.number().nullable().optional(),
    assignedToId: z.number().optional()
});

module.exports = {
    createTaskSchema
};
