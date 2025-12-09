import { api } from '@/lib/axios';

export interface ReportFilterDto {
    search?: string;
    dealerId?: string;
    from?: string; // ISO date string
    to?: string; // ISO date string
    sort?: string;
}

export interface PolicyReportRow {
    policyNumber: string;
    policyType: string;
    dealer: string;
    customer: string;
    vehiclePlate: string;
    startDate: string;
    endDate: string;
    premium: number;
}

export interface DealerReportRow {
    dealer: string;
    policyCount: number;
    totalPremium: number;
}

export interface FinancialReportRow {
    period: string;
    premium: number;
    dealerCommission: number;
    observerCommission: number;
}

export interface AnalyticsReportRow {
    metric: string;
    value: number;
}

export interface PredictionReportRow {
    period: string;
    predictedPremium: number;
}

export const reportsService = {
    /**
     * Get policies report
     */
    async getPolicies(filter?: ReportFilterDto): Promise<PolicyReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<PolicyReportRow[]>(
            `/reports/policies?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get dealers report
     */
    async getDealers(filter?: ReportFilterDto): Promise<DealerReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<DealerReportRow[]>(
            `/reports/dealers?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get dealer performance report
     */
    async getDealerPerformance(filter?: ReportFilterDto): Promise<DealerReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<DealerReportRow[]>(
            `/reports/dealers/performance?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get financial report
     */
    async getFinancial(filter?: ReportFilterDto): Promise<FinancialReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<FinancialReportRow[]>(
            `/reports/financial?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get analytics report
     */
    async getAnalytics(filter?: ReportFilterDto): Promise<AnalyticsReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<AnalyticsReportRow[]>(
            `/reports/analytics?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get predictions report
     */
    async getPredictions(filter?: ReportFilterDto): Promise<PredictionReportRow[]> {
        const params = new URLSearchParams();
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get<PredictionReportRow[]>(
            `/reports/predictions?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Export report
     */
    async export(
        reportType: 'policies' | 'dealers' | 'financial' | 'analytics' | 'predictions',
        format: 'csv' | 'excel' | 'pdf' = 'csv',
        filter?: ReportFilterDto
    ): Promise<Blob> {
        const params = new URLSearchParams();
        params.append('format', format);
        if (filter?.search) params.append('search', filter.search);
        if (filter?.dealerId) params.append('dealerId', filter.dealerId);
        if (filter?.from) params.append('from', filter.from);
        if (filter?.to) params.append('to', filter.to);
        if (filter?.sort) params.append('sort', filter.sort);

        const response = await api.get(`/reports/export/${reportType}?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

