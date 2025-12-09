import { api } from '@/lib/axios';
import { LoginResponse } from '@/types/auth';

export const authService = {
    login: async (data: any) => {
        const response = await api.post<LoginResponse>('/auth/login', data);
        return response.data;
    },

    logout: async () => {
        await api.post('/auth/logout');
    },

    forgotPassword: async (email: string) => {
        await api.post('/auth/forgot-password', { email });
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },
};
