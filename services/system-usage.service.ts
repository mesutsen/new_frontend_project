import { api } from '@/lib/axios';

export interface RequestStats {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    byPath: Record<string, number>;
}

export interface ResponseTimeStats {
    average: number; // milliseconds
    p50: number;
    p95: number;
    p99: number;
    byMethod: Record<string, number>;
    byPath: Record<string, number>;
}

export interface SystemUsage {
    timestamp: string;
    requests: RequestStats;
    responseTime: ResponseTimeStats;
    environment: string;
}

export const systemUsageService = {
    /**
     * Get system usage statistics
     */
    async getUsage(): Promise<SystemUsage> {
        const response = await api.get<SystemUsage>('/metrics/usage');
        return response.data;
    },
};

