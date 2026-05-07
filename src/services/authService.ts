import API from './apiClient';
import type { AuthResponse, UserData } from '../types/types';

interface AuthPayload extends UserData {
  location_id?: string;
}

export const checkPhone = (phone: string, locationId?: string) =>
  API.post<AuthResponse>('/auth/check-phone', {
    phone,
    location_id: locationId,
  });

export const sendOtp = (phone: string, locationId?: string) =>
  API.post<AuthResponse>('/auth/send-otp', {
    phone,
    location_id: locationId,
  });

export const verifyOtp = (phone: string, otp: string, locationId?: string) =>
  API.post<AuthResponse>('/auth/verify-otp', {
    phone,
    otp,
    location_id: locationId,
  });

export const registerUser = (userData: UserData, locationId?: string) =>
  API.post<AuthResponse>('/auth/register', {
    ...userData,
    location_id: locationId,
  } satisfies AuthPayload);

export const loginCustomer = (payload: {
  email?: string;
  phone?: string;
  password: string;
  location_id?: string;
}) => API.post<AuthResponse>('/auth/login', payload);
