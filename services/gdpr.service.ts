import { api } from '@/lib/axios';

export interface ConsentRequest {
    purpose: string;
    granted: boolean;
    metadata?: Record<string, any>;
}

export interface DataAccessRequest {
    format: 'json' | 'xml' | 'csv';
}

export interface ComplianceReport {
    totalConsents: number;
    activeConsents: number;
    dataAccessRequests: number;
    anonymizationRequests: number;
    lastUpdated: string;
}

export const gdprService = {
    /**
     * Set user consent
     */
    async setConsent(request: ConsentRequest, token?: string): Promise<{ message: string }> {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const response = await api.post<{ message: string }>('/gdpr/consent', request, { headers });
        return response.data;
    },

    /**
     * Request user data access
     */
    async requestDataAccess(format: 'json' | 'xml' | 'csv' = 'json'): Promise<Blob> {
        const response = await api.post(
            '/gdpr/data-request',
            { format },
            {
                responseType: 'blob',
            }
        );
        return response.data;
    },

    /**
     * Request data deletion (forget me)
     */
    async forgetMe(): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/gdpr/forget-me');
        return response.data;
    },

    /**
     * Get compliance report (Admin only)
     */
    async getComplianceReport(): Promise<ComplianceReport> {
        const response = await api.get<ComplianceReport>('/gdpr/compliance');
        return response.data;
    },
};
