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

export const updateLeadStage = async (
    { id, stage, notes, summary }: { id: number; stage: LeadType['stage']; notes?: string; summary?: string }
): Promise<LeadType> => {
    const response = await api.put(`/leads/${id}/stage`, { stage, notes, summary });
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

export const exportLeadsExcel = async ({ q }: { q?: string } = {}): Promise<{ blob: Blob; filename?: string }> => {
    const response = await api.get('/leads/export', {
        params: q ? { q } : undefined,
        responseType: 'blob'
    });

    const disposition = response.headers?.['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="([^"]+)"/i);
    const filename = match?.[1];

    return { blob: response.data as Blob, filename };
};
