const { z } = require('zod');

const createInteractionSchema = z.object({
    type: z.enum(["CALL", "EMAIL", "MEETING", "WHATSAPP", "OTHER"]),
    summary: z.string().optional(),
    outcome: z.string().optional(),
    followUpDate: z.coerce.date().refine(date => !isNaN(date.getTime()), { message: "Invalid date" }).optional()
});

module.exports = {
    createInteractionSchema
};
