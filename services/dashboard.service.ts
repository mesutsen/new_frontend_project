import { api } from '@/lib/axios';

export interface AdminDashboardData {
    totalPolicies: number;
    pendingApprovals: number;
    dealers: number;
    customers: number;
    vehicles: number;
}

export interface KpiStat {
    key: string;
    value: number;
    unit: string;
}

export interface ChartPoint {
    label: string;
    value: number;
}

export interface ChartSeries {
    name: string;
    points: ChartPoint[];
}

export interface ChartsData {
    series: ChartSeries[];
}

export interface DealerDashboardData {
    customers: number;
    activePolicies: number;
    totalPolicies: number;
    expiringSoon: number;
    totalRevenue?: number;
    monthlyCommission?: number;
    pendingTasks?: number;
    satisfactionRate?: number;
    renewalRate?: number;
    thisMonthPolicies?: number;
}

export const dashboardService = {
    /**
     * Admin dashboard verilerini getir
     */
    getAdminDashboard: async (): Promise<AdminDashboardData> => {
        const response = await api.get<AdminDashboardData>('/dashboard/admin');
        return response.data;
    },

    /**
     * Dealer dashboard verilerini getir
     */
    getDealerDashboard: async (): Promise<DealerDashboardData> => {
        const response = await api.get<DealerDashboardData>('/dashboard/dealer');
        return response.data;
    },

    /**
     * Dashboard KPI istatistiklerini getir
     */
    getStats: async (): Promise<KpiStat[]> => {
        const response = await api.get<KpiStat[]>('/dashboard/stats');
        return response.data;
    },

    /**
     * Dashboard grafik verilerini getir
     * @param scope Rol bazlı scope (admin, dealer, observer)
     */
    getCharts: async (scope: string = 'admin'): Promise<ChartsData> => {
        const response = await api.get<ChartsData>('/dashboard/charts', {
            params: { scope },
        });
        return response.data;
    },
};

