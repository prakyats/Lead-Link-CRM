import api from '../utils/api';
import { normalizeResponse } from './utils/normalizeResponse';

/**
 * Fetch executive telemetry data for reports.
 * Used for rendering charts and high-level conversion analytics.
 */
export const getReportsData = async (filter: 'today' | 'week' | 'month' = 'month') => {
  const response = await api.get(`/dashboard/reports?filter=${filter}`);
  return normalizeResponse(response.data);
};
