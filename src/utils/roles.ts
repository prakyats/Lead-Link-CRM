
export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    SALES: 'SALES'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES];
export const ADMIN_MANAGER = [ROLES.ADMIN, ROLES.MANAGER];
export const ADMIN_ONLY = [ROLES.ADMIN];
