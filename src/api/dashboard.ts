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
