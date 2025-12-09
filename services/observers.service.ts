import { api } from '@/lib/axios';

export interface ObserverDashboard {
    observedDealers: number;
    activeDealers: number;
    totalPolicies: number;
}

export interface ObserverDealer {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    stats?: {
        totalPolicies: number;
        activePolicies: number;
        monthlyIssued: number;
    };
}

export interface ObserverDealerDetail extends ObserverDealer {
    // Backend'den gelen DealerDto ile aynı yapı
    // Ekstra detay bilgileri backend'den gelirse buraya eklenebilir
}

export interface ActivityLog {
    id: string;
    action: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
}

export interface ObserverReport {
    id: string;
    type: 'Sales' | 'Performance' | 'Regional';
    title: string;
    dateFrom: string;
    dateTo: string;
    data: any;
    createdAt: string;
}

export interface ObserverTask {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'InProgress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    assignedBy?: string; // Deprecated: use createdByUserName instead
    createdByUserName?: string;
    createdAt: string;
    dueDate?: string;
    completedAt?: string;
}

export interface PagedObserverTaskResponse {
    items: ObserverTask[];
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number;
}

export interface PagedObserverDealerResponse {
    items: ObserverDealer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number; // Backend'den gelmeyebilir, hesaplayabiliriz
}

export interface PagedActivityLogResponse {
    items: ActivityLog[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const observersService = {
    /**
     * Get observer dashboard data
     */
    async getDashboard(): Promise<ObserverDashboard> {
        const response = await api.get<ObserverDashboard>('/observer/dashboard');
        return response.data;
    },

    /**
     * Get assigned dealers (paginated)
     */
    async getDealers(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
        region?: string;
    } = {}): Promise<PagedObserverDealerResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.status === 'Active') {
            queryParams.append('isActive', 'true');
        } else if (params.status === 'Inactive') {
            queryParams.append('isActive', 'false');
        }
        if (params.region) {
            queryParams.append('region', params.region);
        }

        const response = await api.get<PagedObserverDealerResponse>(
            `/observer/dealers?${queryParams.toString()}`
        );
        
        // Backend'den totalPages gelmiyorsa hesapla
        const data = response.data;
        if (!data.totalPages && data.pageSize) {
            data.totalPages = Math.ceil(data.total / data.pageSize);
        }
        
        return data;
    },

    /**
     * Get dealer detail by ID
     */
    async getDealerById(id: string): Promise<ObserverDealerDetail> {
        const response = await api.get<ObserverDealer>(`/observer/dealers/${id}`);
        return response.data as ObserverDealerDetail;
    },

    /**
     * Get reports
     */
    async getReports(params: {
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    } = {}): Promise<ObserverReport[]> {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);

        const response = await api.get<ObserverReport[]>(
            `/observer/reports?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get activity logs (paginated)
     */
    async getActivityLogs(params: {
        page?: number;
        pageSize?: number;
        actionType?: string;
        dateFrom?: string;
        dateTo?: string;
        userId?: string;
    } = {}): Promise<PagedActivityLogResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.actionType) queryParams.append('actionType', params.actionType);
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params.userId) queryParams.append('userId', params.userId);

        const response = await api.get<PagedActivityLogResponse>(
            `/observer/activity-logs?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get tasks
     */
    async getTasks(params: {
        status?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PagedObserverTaskResponse> {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedObserverTaskResponse>(
            `/observer/tasks?${queryParams.toString()}`
        );
        const data = response.data;
        // Backend'den totalPages gelmiyorsa hesapla
        if (!data.totalPages && data.pageSize) {
            data.totalPages = Math.ceil(data.total / data.pageSize);
        }
        return data;
    },

    /**
     * Update task status
     */
    async updateTaskStatus(taskId: string, status: 'Pending' | 'InProgress' | 'Completed'): Promise<void> {
        await api.patch(`/observer/tasks/${taskId}/status`, { status });
    },
};

