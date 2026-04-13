import { Role, ROLES } from './roles';

export interface Permissions {
    canViewReports: boolean;
    canModifyTasks: boolean;
    canCreateLeads: boolean;
    canViewGlobalMetrics: boolean;
    canManageSettings: boolean;
    canOperationalControl: boolean; // Add interaction, schedule follow-up
    canSeeAllLeads: boolean;
    canShowTeamOversight: boolean;
    canAssignLeads: boolean;
    canAddInteractions: boolean;
    canManagePipeline: boolean;
    canViewTeamInsights: boolean;
}

export const PERMISSIONS: Record<Role, Permissions> = {
    [ROLES.ADMIN]: {
        canViewReports: true,
        canModifyTasks: false,
        canCreateLeads: false,
        canViewGlobalMetrics: true,
        canManageSettings: true,
        canOperationalControl: false,
        canSeeAllLeads: true,
        canShowTeamOversight: true,
        canAssignLeads: false,
        canAddInteractions: false,
        canManagePipeline: true,
        canViewTeamInsights: true,
    },
    [ROLES.MANAGER]: {
        canViewReports: true,
        canModifyTasks: true,
        canCreateLeads: false,
        canViewGlobalMetrics: false,
        canManageSettings: false,
        canOperationalControl: true,
        canSeeAllLeads: false,
        canShowTeamOversight: true,
        canAssignLeads: true,
        canAddInteractions: true,
        canManagePipeline: false,
        canViewTeamInsights: true,
    },

    [ROLES.SALES]: {
        canViewReports: false,
        canModifyTasks: true,
        canCreateLeads: true,
        canViewGlobalMetrics: false,
        canManageSettings: false,
        canOperationalControl: true,
        canSeeAllLeads: false,
        canShowTeamOversight: false,
        canAssignLeads: false,
        canAddInteractions: true,
        canManagePipeline: true,
        canViewTeamInsights: false,
    },
};

export const hasPermission = (role: Role | string | undefined, permission: keyof Permissions): boolean => {
    if (!role) return false;
    const normalizedRole = (role as string).toUpperCase() as Role;
    const perms = PERMISSIONS[normalizedRole];
    if (!perms) return false;
    return perms[permission];
};

