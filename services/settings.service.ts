import { api } from '@/lib/axios';

export interface SystemSetting {
    key: string;
    value?: string;
    category: string;
    description?: string;
}

export interface CreateSystemSettingRequest {
    key: string;
    value?: string;
    category: string;
    description?: string;
}

export interface UpdateSystemSettingRequest {
    value?: string;
    category: string;
    description?: string;
}

export const settingsService = {
    /**
     * Get all system settings
     */
    async getAll(): Promise<SystemSetting[]> {
        const response = await api.get<SystemSetting[]>('/settings');
        return response.data;
    },

    /**
     * Get system setting by key
     */
    async getByKey(key: string): Promise<SystemSetting> {
        const response = await api.get<SystemSetting>(`/settings/${key}`);
        return response.data;
    },

    /**
     * Create a new system setting
     */
    async create(request: CreateSystemSettingRequest): Promise<SystemSetting> {
        const response = await api.post<SystemSetting>('/settings', request);
        return response.data;
    },

    /**
     * Update a system setting
     */
    async update(key: string, request: UpdateSystemSettingRequest): Promise<void> {
        await api.put(`/settings/${key}`, request);
    },

    /**
     * Delete a system setting
     */
    async delete(key: string): Promise<void> {
        await api.delete(`/settings/${key}`);
    },

    /**
     * Test email sending
     */
    async testEmail(to: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/settings/email/test?to=${encodeURIComponent(to)}`);
        return response.data;
    },
};

