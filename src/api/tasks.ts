import api from '../utils/api';

export interface TaskType {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    status: 'PENDING' | 'COMPLETED';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    leadId: number | null;
    assignedTo: string;
    createdAt: string;
    completedAt?: string;
}

export const getTasks = async (): Promise<TaskType[]> => {
    const response = await api.get('/tasks');
    return response.data;
};

export const createTask = async (task: Partial<TaskType>): Promise<TaskType> => {
    const response = await api.post('/tasks', task);
    return response.data;
};

export const updateTask = async ({ id, task }: { id: number; task: Partial<TaskType> }): Promise<TaskType> => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data;
};

export const toggleCompleteTask = async (id: number): Promise<TaskType> => {
    const response = await api.put(`/tasks/${id}/complete`, {});
    return response.data;
};

export const markTaskComplete = async (id: number): Promise<void> => {
    await api.patch(`/tasks/${id}/complete`);
};

export const getTaskSummary = async (): Promise<{ today: TaskType[], overdue: TaskType[], upcoming: TaskType[] }> => {
    const response = await api.get('/tasks/summary');
    return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};
