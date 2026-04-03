import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import api from '../utils/api';
import { isWithinDays } from '../utils/dateHelpers';
import { useAuth } from './AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { toast } from 'sonner';

export interface Task {
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

interface TasksContextType {
    tasks: Task[];
    loading: boolean;
    fetchTasks: () => Promise<void>;
    createTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (id: number, task: Partial<Task>) => Promise<void>;
    toggleComplete: (id: number) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;
    getUpcomingTasks: (days?: number) => Task[];
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user } = useAuth();

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createTask = useCallback(async (task: Partial<Task>) => {
        try {
            const response = await api.post('/tasks', task);
            setTasks(prev => [...prev, response.data]);
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }, []);

    const updateTask = useCallback(async (id: number, task: Partial<Task>) => {
        try {
            const response = await api.put(`/tasks/${id}`, task);
            setTasks(prev => prev.map(t => t.id === id ? response.data : t));
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }, []);

    const toggleComplete = useCallback(async (id: number) => {
        const previousTasks = [...tasks];
        // Optimistic Toggle
        setTasks(prev => prev.map(t => 
            t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t
        ));

        try {
            const response = await api.put(`/tasks/${id}/complete`, {});
            // Sync with server
            setTasks(prev => prev.map(t => t.id === id ? response.data : t));
        } catch (error) {
            console.error('Error toggling task:', error);
            // Rollback
            setTasks(previousTasks);
            toast.error('Failed to update task status.', {
                description: 'We had trouble reaching the server. Your change has been reverted.'
            });
            throw error;
        }
    }, [tasks]);

    const deleteTask = useCallback(async (id: number) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }, []);

    const getUpcomingTasks = useCallback((days: number = 7): Task[] => {
        return tasks
            .filter(t => t.status === 'PENDING' && isWithinDays(t.dueDate, days))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [tasks]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchTasks();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchTasks]);

    const value = useMemo(() => ({
        tasks,
        loading,
        fetchTasks,
        createTask,
        updateTask,
        toggleComplete,
        deleteTask,
        getUpcomingTasks
    }), [tasks, loading]);

    return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
    const context = useContext(TasksContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
}
