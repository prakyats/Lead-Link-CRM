/**
 * LeadLink CRM — Centralized Backend Validation Utility
 * Mirrors src/utils/validation.ts on the frontend.
 * Import in any controller: const { validateEmail, validateLeadBody } = require('./validation');
 */

const PATTERNS = {
    // Stricter email validation to ensure common/legitimate TLDs as requested
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|org|net|in|gov|edu|me|io|co|biz)$/i,
    phone: /^\d{10}$/,
    // Allowing 1 or more characters for name
    name:  /^[A-Za-z ]{1,}$/,
};

const LIMITS = {
    name:        { min: 1, max: 50 },
    taskTitle:   { min: 2, max: 100 },
    description: { max: 500 },
    password:    { min: 6 },
    company:     { min: 2, max: 100 },
};

// ─── Individual validators (return error string or null) ──────────────────

function validateEmail(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Email address is required';
    if (!PATTERNS.email.test(trimmed)) return 'Please enter a valid email address (e.g., user@example.com)';
    return null;
}

function validatePhone(value) {
    if (!value || String(value).trim() === '') return null; // optional
    const digits = String(value).replace(/\s/g, '');
    if (!PATTERNS.phone.test(digits)) return 'Phone number must be exactly 10 digits';
    return null;
}

function validateName(value, label = 'Name') {
    const trimmed = (value || '').trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length < LIMITS.name.min) return `${label} must be at least ${LIMITS.name.min} characters`;
    if (trimmed.length > LIMITS.name.max) return `${label} must be under ${LIMITS.name.max} characters`;
    if (!PATTERNS.name.test(trimmed)) return `${label} must contain only letters and spaces`;
    return null;
}

function validateRequired(value, label = 'This field') {
    if (!value || !String(value).trim()) return `${label} is required`;
    return null;
}

function validateTaskTitle(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Task title is required';
    if (trimmed.length < LIMITS.taskTitle.min) return `Title must be at least ${LIMITS.taskTitle.min} characters`;
    if (trimmed.length > LIMITS.taskTitle.max) return `Title must be under ${LIMITS.taskTitle.max} characters`;
    return null;
}

function validateDescription(value) {
    if (value && value.trim().length > LIMITS.description.max) {
        return `Description must be under ${LIMITS.description.max} characters`;
    }
    return null;
}

function validatePassword(value) {
    if (!value || !String(value).trim()) return 'Password is required';
    if (String(value).length < LIMITS.password.min) return `Password must be at least ${LIMITS.password.min} characters`;
    return null;
}

function validateCompany(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return 'Company name is required';
    if (trimmed.length < LIMITS.company.min) return `Company name must be at least ${LIMITS.company.min} characters`;
    if (trimmed.length > LIMITS.company.max) return `Company name must be under ${LIMITS.company.max} characters`;
    return null;
}

// ─── Sanitization ─────────────────────────────────────────────────────────

function sanitizeString(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
    return (phone || '').replace(/\D/g, '');
}

// ─── Form-level validators (return errors object) ─────────────────────────

/**
 * Validate a lead create/update body.
 * Returns { errors: {}, isValid: bool }
 */
function validateLeadBody(body, isUpdate = false) {
    const errors = {};

    if (!isUpdate || body.company !== undefined) {
        const err = validateCompany(body.company);
        if (err) errors.company = err;
    }
    if (!isUpdate || body.contact !== undefined) {
        const err = validateName(body.contact, 'Contact name');
        if (err) errors.contact = err;
    }
    if (!isUpdate || body.email !== undefined) {
        const err = validateEmail(body.email);
        if (err) errors.email = err;
    }
    if (body.phone !== undefined) {
        const err = validatePhone(body.phone);
        if (err) errors.phone = err;
    }
    if (!isUpdate && (body.value === undefined || body.value === null || Number(body.value) < 0)) {
        errors.value = 'Please enter a valid projected value (0 or more)';
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * Validate a task create body.
 */
function validateTaskBody(body) {
    const errors = {};
    const titleErr = validateTaskTitle(body.title);
    if (titleErr) errors.title = titleErr;
    const descErr = validateDescription(body.description);
    if (descErr) errors.description = descErr;
    return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * Validate auth (login/register) body.
 */
function validateAuthBody(body, isRegister = false) {
    const errors = {};
    const emailErr = validateEmail(body.email);
    if (emailErr) errors.email = emailErr;
    if (!body.password || !String(body.password).trim()) {
        errors.password = 'Password is required';
    }
    if (isRegister) {
        const pwErr = validatePassword(body.password);
        if (pwErr) errors.password = pwErr;
        const nameErr = validateName(body.name, 'Full name');
        if (nameErr) errors.name = nameErr;
    }
    return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * Validate user provision body (Admin → create user).
 */
function validateUserBody(body) {
    const errors = {};
    const nameErr = validateName(body.name, 'Full name');
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(body.email);
    if (emailErr) errors.email = emailErr;
    const pwErr = validatePassword(body.password);
    if (pwErr) errors.password = pwErr;
    const validRoles = ['ADMIN', 'MANAGER', 'SALES'];
    if (!body.role || !validRoles.includes(String(body.role).toUpperCase())) {
        errors.role = 'Role must be one of: ADMIN, MANAGER, SALES';
    }
    return { errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = {
    validateEmail,
    validatePhone,
    validateName,
    validateRequired,
    validateTaskTitle,
    validateDescription,
    validatePassword,
    validateCompany,
    validateLeadBody,
    validateTaskBody,
    validateAuthBody,
    validateUserBody,
    sanitizeString,
    normalizeEmail,
    normalizePhone,
    PATTERNS,
    LIMITS,
};
