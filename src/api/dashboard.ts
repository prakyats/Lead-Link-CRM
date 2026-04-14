import api from '../utils/api';
import { normalizeResponse } from './utils/normalizeResponse';

export const getDashboardSummary = async () => {
    const response = await api.get('/dashboard/summary');
    return normalizeResponse(response.data);
};

export const getRecentLeads = async () => {
    const response = await api.get('/dashboard/recent-leads');
    return normalizeResponse(response.data);
};

export const getDashboardKpis = async () => {
    const response = await api.get('/dashboard/kpis');
    return normalizeResponse(response.data);
};

export const getTeamActivity = async () => {
    const response = await api.get('/dashboard/team-activity');
    return normalizeResponse(response.data);
};

export const getTeamPerformance = async () => {
    const response = await api.get('/dashboard/team-performance');
    return normalizeResponse(response.data);
};

export const getTeamPipeline = async () => {
    const response = await api.get('/dashboard/team-pipeline');
    return normalizeResponse(response.data);
};

export const getTeamRisk = async () => {
    const response = await api.get('/dashboard/team-risk');
    return normalizeResponse(response.data);
};
