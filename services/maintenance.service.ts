import { api } from '@/lib/axios';

export interface MaintenanceStatus {
    isActive: boolean;
    message?: string;
    until?: string; // ISO date string
    affectedPortals?: string[];
}

export interface ActivateMaintenanceRequest {
    affectedPortals: string[];
    message: string;
    until?: string; // ISO date string
}

export const maintenanceService = {
    /**
     * Get current maintenance mode status
     */
    async getStatus(): Promise<MaintenanceStatus> {
        const response = await api.get<MaintenanceStatus>('/maintenance');
        return response.data;
    },

    /**
     * Activate maintenance mode
     */
    async activate(request: ActivateMaintenanceRequest): Promise<void> {
        await api.post('/maintenance', request);
    },

    /**
     * Deactivate maintenance mode
     */
    async deactivate(): Promise<void> {
        await api.delete('/maintenance');
    },
};

