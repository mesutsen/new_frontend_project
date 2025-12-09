import { api } from '@/lib/axios';

export interface FraudDetectionLog {
    id: string;
    transactionId: string;
    entityName: string;
    entityId: string;
    riskScore: number;
    reasonsJson?: string;
    status: 'New' | 'Suspicious' | 'Reviewed';
    createdAt: string;
}

export interface PagedFraudResponse {
    items: FraudDetectionLog[];
    totalCount: number;
}

export interface ReviewRequest {
    decision: string; // e.g., false_positive, confirmed_fraud
}

export const fraudService = {
    /**
     * Get suspicious fraud detection logs
     */
    async getSuspicious(params: {
        pageNumber?: number;
        pageSize?: number;
    } = {}): Promise<PagedFraudResponse> {
        const queryParams = new URLSearchParams();
        if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedFraudResponse>(
            `/fraud/suspicious?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Review a fraud detection log
     */
    async review(id: string, decision: string): Promise<void> {
        await api.patch(`/fraud/${id}/review`, { decision });
    },
};

