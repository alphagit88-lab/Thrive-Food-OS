import API from './apiClient';
import type { ChefSession } from '../types/types';

interface ChefLoginApiResponse {
  success: boolean;
  data?: ChefSession;
  error?: string;
  message?: string;
}

export const loginChef = async (email: string, password: string): Promise<ChefSession> => {
  const response = await API.post<ChefLoginApiResponse>('/users/login', { email, password });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || response.data.message || 'Chef login failed.');
  }

  return response.data.data;
};
