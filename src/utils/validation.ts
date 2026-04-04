/**
 * LeadLink CRM — Centralized Frontend Validation Utility
 * Single source of truth for all validation rules.
 * Mirrors the backend validation in server/utils/validation.js
 */

// ─── Regex Patterns ────────────────────────────────────────────────────────

export const PATTERNS = {
    // Stricter email validation to ensure common/legitimate TLDs
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|org|net|in|gov|edu|me|io|co|biz)$/i,
    phone: /^\d{10}$/,
    // Allowing 1 or more characters for name
    name: /^[A-Za-z ]{1,}$/,
};

// ─── Limits ────────────────────────────────────────────────────────────────

export const LIMITS = {
    name: { min: 1, max: 50 },
    taskTitle: { min: 2, max: 100 },
    description: { max: 500 },
    password: { min: 6 },
    company: { min: 2, max: 100 },
};

// ─── Individual Field Validators ────────────────────────────────────────────

export function validateEmail(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return 'Email address is required';
    if (!PATTERNS.email.test(trimmed)) {
        return 'Please enter a valid email address (e.g., user@example.com)';
    }
    return null;
}

export function validatePhone(value: string): string | null {
    if (!value || value.trim() === '') return null; // phone is optional
    const digits = value.replace(/\s/g, '');
    if (!PATTERNS.phone.test(digits)) {
        return 'Phone number must be exactly 10 digits';
    }
    return null;
}

export function validateName(value: string, label = 'Name'): string | null {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length < LIMITS.name.min) return `${label} must be at least ${LIMITS.name.min} characters`;
    if (trimmed.length > LIMITS.name.max) return `${label} must be under ${LIMITS.name.max} characters`;
    if (!PATTERNS.name.test(trimmed)) return `${label} must contain only letters and spaces`;
    return null;
}

export function validateRequired(value: string, label = 'This field'): string | null {
    if (!value || !value.trim()) return `${label} is required`;
    return null;
}

export function validateTaskTitle(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return 'Task title is required';
    if (trimmed.length < LIMITS.taskTitle.min) return `Title must be at least ${LIMITS.taskTitle.min} characters`;
    if (trimmed.length > LIMITS.taskTitle.max) return `Title must be under ${LIMITS.taskTitle.max} characters`;
    return null;
}

export function validateDescription(value: string): string | null {
    if (value && value.trim().length > LIMITS.description.max) {
        return `Description must be under ${LIMITS.description.max} characters`;
    }
    return null;
}

export function validatePassword(value: string): string | null {
    if (!value || !value.trim()) return 'Password is required';
    if (value.length < LIMITS.password.min) return `Password must be at least ${LIMITS.password.min} characters`;
    return null;
}

export function validateCompany(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return 'Company name is required';
    if (trimmed.length < LIMITS.company.min) return `Company name must be at least ${LIMITS.company.min} characters`;
    if (trimmed.length > LIMITS.company.max) return `Company name must be under ${LIMITS.company.max} characters`;
    return null;
}

// ─── Sanitization Helpers ───────────────────────────────────────────────────

/** Trim all string values in a plain object */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
    const result = { ...data };
    for (const key in result) {
        if (typeof result[key] === 'string') {
            result[key] = result[key].trim() as any;
        }
    }
    return result;
}

/** Normalize email: lowercase + trim */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Strip non-digit characters from phone */
export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

// ─── Form-level Validation Maps ─────────────────────────────────────────────

export type ValidationErrors = Record<string, string>;

/**
 * Validate the Login form.
 * Returns field → error message map (empty = valid).
 */
export function validateLoginForm(data: {
    organizationSlug: string;
    email: string;
    password: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!data.organizationSlug.trim()) errors.organization = 'Workspace ID is required';
    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;
    const pwErr = validatePassword(data.password);
    if (pwErr) errors.password = pwErr;
    return errors;
}

/**
 * Validate the Create Lead form.
 */
export function validateLeadForm(data: {
    company: string;
    contact: string;
    email: string;
    phone: string;
    value: number | string;
}): ValidationErrors {
    const errors: ValidationErrors = {};
    const companyErr = validateCompany(data.company);
    if (companyErr) errors.company = companyErr;
    const contactErr = validateName(data.contact, 'Contact name');
    if (contactErr) errors.contact = contactErr;
    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;
    const phoneErr = validatePhone(String(data.phone || ''));
    if (phoneErr) errors.phone = phoneErr;
    if (data.value === '' || data.value === null || data.value === undefined || Number(data.value) < 0) {
        errors.value = 'Please enter a valid projected value (0 or more)';
    }
    return errors;
}

/**
 * Validate the Create Task/Activity form.
 */
export function validateTaskForm(data: {
    title: string;
    description: string;
    dueDate: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};
    const titleErr = validateTaskTitle(data.title);
    if (titleErr) errors.title = titleErr;
    const descErr = validateDescription(data.description);
    if (descErr) errors.description = descErr;
    if (!data.dueDate) errors.dueDate = 'Due date and time are required';
    return errors;
}

/**
 * Validate the Create User form (Settings → Provision User).
 */
export function validateUserForm(data: {
    name: string;
    email: string;
    password: string;
}): ValidationErrors {
    const errors: ValidationErrors = {};
    const nameErr = validateName(data.name, 'Full name');
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(data.email);
    if (emailErr) errors.email = emailErr;
    const pwErr = validatePassword(data.password);
    if (pwErr) errors.password = pwErr;
    return errors;
}
