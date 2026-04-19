import api from '../utils/api';
import { normalizeResponse } from './utils/normalizeResponse';

export interface TaskType {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    status: 'PENDING' | 'COMPLETED';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    leadId: number | null;
    assignedTo: string;
    assignedToId?: number;
    createdAt: string;
    completedAt?: string;
    createdBy?: string;
    taskType?: 'SELF' | 'DELEGATED';
}

// ── Role-Aware Response Shapes ────────────────────────────────────────────────

export interface TaskCounts {
    totalTasks: number;
    overdueCount: number;
    pendingCount: number;
    completedCount: number;
}

/** Legacy type: admin /tasks previously returned manager summaries only */
export interface AdminManagerSummary extends TaskCounts {
    managerId: number;
    managerName: string;
}

/** Manager sees: one card per rep, with full task list */
export interface ManagerRepGroup extends TaskCounts {
    repId: number;
    repName: string;
    tasks: TaskType[];
}

/** Sales sees: flat task list */
export interface SalesTaskData {
    tasks: TaskType[];
}

export type RoleTaskResponse = {
    role: 'ADMIN' | 'MANAGER' | 'SALES';
    payload: AdminManagerSummary[] | ManagerRepGroup[] | SalesTaskData;
};

/** Unwrap role-shaped /tasks responses into a flat list for the Tasks page. */
export function flattenTasksFromRoleResponse(raw: any): TaskType[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    const payload = raw.payload;
    if (!payload) return [];
    if (Array.isArray(payload.tasks)) return payload.tasks;
    if (Array.isArray(payload)) {
        return payload.flatMap((g: ManagerRepGroup) => (Array.isArray(g.tasks) ? g.tasks : []));
    }
    return [];
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const getTasks = async (): Promise<TaskType[]> => {
    const response = await api.get('/tasks');
    const raw = normalizeResponse(response.data);
    return flattenTasksFromRoleResponse(raw);
};

export const createTask = async (task: Partial<TaskType>): Promise<TaskType> => {
    const response = await api.post('/tasks', task);
    return normalizeResponse(response.data);
};

export const updateTask = async ({ id, task }: { id: number; task: Partial<TaskType> }): Promise<TaskType> => {
    const response = await api.put(`/tasks/${id}`, task);
    return normalizeResponse(response.data);
};

export const toggleCompleteTask = async (id: number): Promise<TaskType> => {
    const response = await api.put(`/tasks/${id}/complete`, {});
    return normalizeResponse(response.data);
};

export const markTaskComplete = async (id: number): Promise<void> => {
    await api.patch(`/tasks/${id}/complete`);
};

export const getTaskSummary = async (): Promise<{ today: TaskType[], overdue: TaskType[], upcoming: TaskType[] }> => {
    const response = await api.get('/tasks/summary');
    return normalizeResponse(response.data);
};

export const deleteTask = async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};
