export type ValidationErrors = Record<string, string>;

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
};

export const validateName = (name: string, fieldName: string = 'Name'): string | null => {
  if (!name || !name.trim()) return `${fieldName} is required`;
  if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
  return null;
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const validateLoginForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};
  const orgErr = validateRequired(data.organizationSlug, 'Workspace ID');
  if (orgErr) errors.organization = orgErr;
  
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  
  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;
  
  return errors;
};

export const validateLeadForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const companyErr = validateName(data.company, 'Company name');
  if (companyErr) errors.company = companyErr;
  
  const contactErr = validateName(data.contact, 'Contact name');
  if (contactErr) errors.contact = contactErr;
  
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  
  if (data.phone && data.phone.length > 0) {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.phone = 'Phone must be a 10-digit number';
    }
  }
  
  return errors;
};

export const validateCompany = (company: string): string | null => {
  return validateName(company, 'Company name');
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Phone is optional
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) return 'Phone must be a 10-digit number';
  return null;
};

export const validateTaskForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const titleErr = validateName(data.title, 'Activity title');
  if (titleErr) errors.title = titleErr;
  
  if (!data.dueDate) {
    errors.dueDate = 'Due date is required';
  }
  
  return errors;
};

export const validateTaskTitle = (title: string): string | null => {
  return validateName(title, 'Activity title');
};

export const validateDescription = (desc: string): string | null => {
  if (desc && desc.length > 500) return 'Description cannot exceed 500 characters';
  return null;
};

export const validateUserForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const nameErr = validateName(data.name, 'Full name');
  if (nameErr) errors.name = nameErr;
  
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  
  const passErr = validatePassword(data.password);
  if (passErr) errors.password = passErr;
  
  return errors;
};
