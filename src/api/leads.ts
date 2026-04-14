import api from '../utils/api';
import { normalizeResponse } from './utils/normalizeResponse';


export interface InteractionType {
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

export interface LeadType {
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
    managerName?: string | null;
    risk?: 'high' | 'medium' | 'low';
    interactions?: InteractionType[];
}

export const getLeads = async (): Promise<LeadType[]> => {
    const response = await api.get('/leads');
    return normalizeResponse(response.data);
};

export const getLeadById = async (id: number): Promise<LeadType> => {
    const response = await api.get(`/leads/${id}`);
    return normalizeResponse(response.data);
};

export const createLead = async (lead: Partial<LeadType>): Promise<LeadType> => {
    const response = await api.post('/leads', lead);
    return normalizeResponse(response.data);
};

export const updateLead = async ({ id, lead }: { id: number; lead: Partial<LeadType> }): Promise<LeadType> => {
    const response = await api.put(`/leads/${id}`, lead);
    return normalizeResponse(response.data);
};

export const updateLeadStage = async ({ id, stage }: { id: number; stage: LeadType['stage'] }): Promise<LeadType> => {
    const response = await api.put(`/leads/${id}/stage`, { stage });
    return normalizeResponse(response.data);
};

export const deleteLead = async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}`);
};

export const assignLead = async ({ id, assignedToId }: { id: number; assignedToId: number }): Promise<LeadType> => {
    const response = await api.put(`/leads/${id}/assign`, { assignedToId });
    return normalizeResponse(response.data);
};

export const addInteraction = async ({ leadId, interaction }: { leadId: number; interaction: any }): Promise<void> => {
    await api.post('/interactions', { ...interaction, leadId });
};
