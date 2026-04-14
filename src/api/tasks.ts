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

/** Admin sees: one card per manager, no individual tasks */
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

// ── API Functions ─────────────────────────────────────────────────────────────

export const getTasks = async (): Promise<RoleTaskResponse> => {
    const response = await api.get('/tasks');
    return normalizeResponse(response.data);
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
