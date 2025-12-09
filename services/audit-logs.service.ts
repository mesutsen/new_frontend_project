import { api } from '@/lib/axios';

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    entityName: string;
    entityId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: string;
    newValues?: string;
}

export interface AuditLogListParams {
    pageNumber?: number;
    pageSize?: number;
    entityName?: string;
    action?: string;
    userId?: string;
    from?: string; // ISO date string
    to?: string; // ISO date string
}

export interface PagedAuditLogResponse {
    items: AuditLog[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface ExportParams {
    format?: 'csv' | 'pdf';
    entityName?: string;
    userId?: string;
    from?: string;
    to?: string;
}

export const auditLogsService = {
    /**
     * Get paginated audit logs with filters
     */
    async getAuditLogs(params: AuditLogListParams = {}): Promise<PagedAuditLogResponse> {
        const queryParams = new URLSearchParams();
        
        if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.entityName) queryParams.append('entityName', params.entityName);
        if (params.action) queryParams.append('action', params.action);
        if (params.userId) queryParams.append('userId', params.userId);
        // Convert local datetime to UTC ISO string
        if (params.from) {
            const fromDate = new Date(params.from);
            queryParams.append('from', fromDate.toISOString());
        }
        if (params.to) {
            const toDate = new Date(params.to);
            queryParams.append('to', toDate.toISOString());
        }

        const response = await api.get<PagedAuditLogResponse>(
            `/auditlogs?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get audit logs for a specific entity
     */
    async getByEntity(entityName: string, entityId: string): Promise<AuditLog[]> {
        const response = await api.get<AuditLog[]>(
            `/auditlogs/entity/${entityName}/${entityId}`
        );
        return response.data;
    },

    /**
     * Get audit logs for a specific user
     */
    async getByUser(userId: string): Promise<AuditLog[]> {
        const response = await api.get<AuditLog[]>(`/auditlogs/user/${userId}`);
        return response.data;
    },

    /**
     * Export audit logs as CSV or PDF
     */
    async export(params: ExportParams = {}): Promise<Blob> {
        const queryParams = new URLSearchParams();
        
        if (params.format) queryParams.append('format', params.format);
        if (params.entityName) queryParams.append('entityName', params.entityName);
        if (params.userId) queryParams.append('userId', params.userId);
        // Convert local datetime to UTC ISO string
        if (params.from) {
            const fromDate = new Date(params.from);
            queryParams.append('from', fromDate.toISOString());
        }
        if (params.to) {
            const toDate = new Date(params.to);
            queryParams.append('to', toDate.toISOString());
        }

        const response = await api.get(`/auditlogs/export?${queryParams.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

