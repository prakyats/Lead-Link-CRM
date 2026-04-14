import api from '../utils/api';
import { normalizeResponse } from './utils/normalizeResponse';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES';
  createdAt?: string;
  manager?: { name: string };
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return normalizeResponse(response.data);
};

export const getSalesUsers = async (): Promise<User[]> => {
  const response = await api.get('/users/sales');
  return normalizeResponse(response.data);
};
