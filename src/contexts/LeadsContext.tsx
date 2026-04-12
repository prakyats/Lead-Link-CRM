import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/roles';
import { toast } from 'sonner';

export interface Lead {
    id: number;
    company: string;
    contact: string;
    email: string;
    phone: string;
    value: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    stage: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';

    leadScore: number;
    lastInteraction: string;
    createdAt: string;
    assignedTo?: string;
    assignedToId?: number;
    risk?: 'high' | 'medium' | 'low';
    interactions?: Interaction[];
}

export interface Interaction {
    id: number;
    leadId: number;
    type: 'EMAIL' | 'CALL' | 'MEETING' | 'WHATSAPP' | 'OTHER';
    date: string;
    notes?: string;
    summary?: string;
    outcome?: string;
    followUpDate?: string;
    performedBy: string;
}

interface LeadsContextType {
    leads: Lead[];
    loading: boolean;
    fetchLeads: () => Promise<void>;
    getLeadById: (id: number) => Promise<Lead | null>;
    createLead: (lead: Partial<Lead>) => Promise<void>;
    updateLead: (id: number, lead: Partial<Lead>) => Promise<void>;
    updateLeadStage: (id: number, stage: Lead['stage']) => Promise<void>;
    deleteLead: (id: number) => Promise<void>;
    assignLead: (id: number, assignedToId: number) => Promise<void>;
    addInteraction: (leadId: number, interaction: any) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: ReactNode }) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user } = useAuth();

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/leads');
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createLead = useCallback(async (lead: Partial<Lead>) => {
        try {
            const response = await api.post('/leads', lead);
            setLeads(prev => [...prev, response.data]);
        } catch (error) {
            console.error('Error creating lead:', error);
            throw error;
        }
    }, []);

    const updateLead = useCallback(async (id: number, lead: Partial<Lead>) => {
        try {
            const response = await api.put(`/leads/${id}`, lead);
            setLeads(prev => prev.map(l => l.id === id ? response.data : l));
        } catch (error) {
            console.error('Error updating lead:', error);
            throw error;
        }
    }, []);

    const updateLeadStage = useCallback(async (id: number, stage: Lead['stage']) => {
        const previousLeads = [...leads];
        // Optimistic Update
        setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
        
        try {
            const response = await api.put(`/leads/${id}/stage`, { stage });
            // Sync with server response
            setLeads(prev => prev.map(l => l.id === id ? response.data : l));
        } catch (error) {
            console.error('Error updating lead stage:', error);
            // Rollback
            setLeads(previousLeads);
            toast.error('Failed to update stage. Reverting changes.', {
                description: 'The server might be waking up or experiencing an issue.'
            });
            throw error;
        }
    }, [leads]);

    const deleteLead = useCallback(async (id: number) => {
        try {
            await api.delete(`/leads/${id}`);
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    }, []);

    const assignLead = useCallback(async (id: number, assignedToId: number) => {
        try {
            const response = await api.put(`/leads/${id}/assign`, { assignedToId });
            setLeads(prev => prev.map(l => l.id === id ? response.data : l));
        } catch (error) {
            console.error('Error assigning lead:', error);
            throw error;
        }
    }, []);

    const getLeadById = useCallback(async (id: number): Promise<Lead | null> => {
        try {
            const response = await api.get(`/leads/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching lead:', error);
            return null;
        }
    }, []);

    const addInteraction = useCallback(async (leadId: number, interaction: any) => {
        try {
            await api.post('/interactions', { ...interaction, leadId });
            // Refresh leads to get updated timeline and lastInteraction
            await fetchLeads();
            toast.success('Interaction logged successfully');
        } catch (error: any) {
            console.error('Error logging interaction:', error);
            toast.error(error.response?.data?.error || 'Failed to log interaction');
            throw error;
        }
    }, [fetchLeads]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchLeads]);

    const value = useMemo(() => ({
        leads,
        loading,
        fetchLeads,
        getLeadById,
        createLead,
        updateLead,
        updateLeadStage,
        deleteLead,
        assignLead,
        addInteraction
    }), [leads, loading, addInteraction]);

    return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
    const context = useContext(LeadsContext);
    if (context === undefined) {
        throw new Error('useLeads must be used within a LeadsProvider');
    }
    return context;
}
