import api from '../utils/api';

export const getDashboardSummary = async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
};

export const getRecentLeads = async () => {
    const response = await api.get('/dashboard/recent-leads');
    return response.data;
};

export const getDashboardKpis = async () => {
    const response = await api.get('/dashboard/kpis');
    return response.data;
};

export const getTeamActivity = async () => {
    const response = await api.get('/dashboard/team-activity');
    return response.data;
};

export const getTeamPerformance = async () => {
    const response = await api.get('/dashboard/team-performance');
    return response.data;
};

export const getTeamPipeline = async () => {
    const response = await api.get('/dashboard/team-pipeline');
    return response.data;
};

export const getTeamRisk = async () => {
    const response = await api.get('/dashboard/team-risk');
    return response.data;
};
