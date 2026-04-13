import api from '../utils/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES';
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};
