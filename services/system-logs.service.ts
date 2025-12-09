import { api } from '@/lib/axios';

export interface SystemLog {
    id: string;
    timestamp: string;
    level: string; // Info, Warning, Error, Fatal
    message: string;
    exception?: string;
    logger: string;
    userId?: string;
    ipAddress?: string;
    requestPath?: string;
    additionalData?: string; // JSON formatında
}

export interface SystemLogListParams {
    pageNumber?: number;
    pageSize?: number;
    level?: string;
    logger?: string;
    userId?: string;
    from?: string; // ISO date string
    to?: string; // ISO date string
    search?: string;
}

export interface PagedSystemLogResponse {
    items: SystemLog[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface ExportParams {
    format?: 'csv' | 'pdf';
    level?: string;
    userId?: string;
    from?: string;
    to?: string;
}

export const systemLogsService = {
    /**
     * Get paginated system logs with filters
     */
    async getSystemLogs(params: SystemLogListParams = {}): Promise<PagedSystemLogResponse> {
        const queryParams = new URLSearchParams();
        
        if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.level) queryParams.append('level', params.level);
        if (params.logger) queryParams.append('logger', params.logger);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.from) {
            const fromDate = new Date(params.from);
            queryParams.append('from', fromDate.toISOString());
        }
        if (params.to) {
            const toDate = new Date(params.to);
            queryParams.append('to', toDate.toISOString());
        }
        if (params.search) queryParams.append('search', params.search);

        const response = await api.get<PagedSystemLogResponse>(
            `/system-logs?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get system logs for a specific level
     */
    async getByLevel(level: string): Promise<SystemLog[]> {
        const response = await api.get<SystemLog[]>(`/system-logs/level/${level}`);
        return response.data;
    },

    /**
     * Get system logs for a specific user
     */
    async getByUser(userId: string): Promise<SystemLog[]> {
        const response = await api.get<SystemLog[]>(`/system-logs/user/${userId}`);
        return response.data;
    },

    /**
     * Export system logs as CSV or PDF
     */
    async export(params: ExportParams = {}): Promise<Blob> {
        const queryParams = new URLSearchParams();
        
        if (params.format) queryParams.append('format', params.format);
        if (params.level) queryParams.append('level', params.level);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.from) {
            const fromDate = new Date(params.from);
            queryParams.append('from', fromDate.toISOString());
        }
        if (params.to) {
            const toDate = new Date(params.to);
            queryParams.append('to', toDate.toISOString());
        }

        const response = await api.get(`/system-logs/export?${queryParams.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

