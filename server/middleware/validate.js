const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: result.error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    // Replace request payload with validated and parsed data
    req[source] = result.data;
    next();
};

module.exports = validate;
