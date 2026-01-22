import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor para adicionar token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor para lidar com erros de autenticação
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expirado, fazer logout
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email: string, senha: string, twoFactorCode?: string) =>
        api.post('/auth/login', { email, senha, twoFactorCode }),

    getMe: () => api.get('/auth/me'),

    enable2FA: () => api.post('/auth/2fa/enable'),

    verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),
};

// Empresas API
export const empresasAPI = {
    list: (params?: any) => api.get('/empresas', { params }),

    get: (id: string) => api.get(`/empresas/${id}`),

    create: (data: any) => api.post('/empresas', data),

    update: (id: string, data: any) => api.put(`/empresas/${id}`, data),

    delete: (id: string) => api.delete(`/empresas/${id}`),

    stats: (id: string) => api.get(`/empresas/${id}/stats`),
};

// Documentos API
export const documentosAPI = {
    list: (params?: any) => api.get('/documentos', { params }),

    upload: (formData: FormData) =>
        api.post('/documentos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    download: (id: string) =>
        api.get(`/documentos/${id}/download`, { responseType: 'blob' }),

    getProtocol: (id: string) => api.get(`/documentos/${id}/protocolo`),

    delete: (id: string) => api.delete(`/documentos/${id}`),
};

// Logs API
export const logsAPI = {
    list: (params?: any) => api.get('/logs', { params }),

    export: () => api.get('/logs/export', { responseType: 'blob' }),

    stats: (params?: any) => api.get('/logs/stats', { params }),
};
