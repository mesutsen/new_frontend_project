import { api } from '@/lib/axios';

export interface PricingPlan {
    id: string;
    policyType: string;
    seriesId?: string;
    currency: string;
    baseDailyRate: number;
    taxRate: number;
    dealerCommissionRate: number;
    observerCommissionRate: number;
    minPrice?: number;
    maxPrice?: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
}

export interface CreatePricingPlanRequest {
    policyType: string;
    seriesId?: string;
    currency: string;
    baseDailyRate: number;
    taxRate: number;
    dealerCommissionRate: number;
    observerCommissionRate: number;
    minPrice?: number;
    maxPrice?: number;
    validFrom: string;
    validTo: string;
    isActive?: boolean;
}

export interface UpdatePricingPlanRequest extends CreatePricingPlanRequest {}

export interface CalculatePriceRequest {
    customerId: string;
    vehicleId: string;
    policyType: string;
    currency?: string;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    durationDays?: number; // Süre seçimi: 1, 15, 30, 90, 365
}

export interface CalculatePriceResponse {
    currencyId: string;
    currency: string;
    currencySymbol: string;
    basePrice: number;
    taxes: number;
    total: number;
    dealerCommission: number;
    observerCommission: number;
    // Farklı para birimlerinde fiyatlar (EUR, BGN, TRY)
    pricesInOtherCurrencies?: Record<string, number>;
}

export const pricingPlansService = {
    /**
     * Aktif fiyat planını getir (policy type'a göre)
     */
    getActivePlan: async (policyType: string, currency: string = 'TRY', on?: string): Promise<PricingPlan | null> => {
        try {
            const params: any = { policyType, currency };
            if (on) params.on = on;
            const response = await api.get<PricingPlan | null>('/pricing-plans/active', { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    },

    /**
     * Seriye göre aktif fiyat planını getir
     */
    getActivePlanBySeries: async (seriesId: string, policyType: string, currency: string = 'TRY', on?: string): Promise<PricingPlan | null> => {
        try {
            const params: any = { seriesId, policyType, currency };
            if (on) params.on = on;
            const response = await api.get<PricingPlan | null>('/pricing-plans/active-by-series', { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    },

    /**
     * Fiyat hesapla
     */
    calculatePrice: async (data: CalculatePriceRequest): Promise<CalculatePriceResponse> => {
        const response = await api.post<CalculatePriceResponse>('/pricing-plans/calculate', {
            customerId: data.customerId,
            vehicleId: data.vehicleId,
            policyType: data.policyType,
            currency: data.currency || 'TRY',
            startDate: data.startDate,
            endDate: data.endDate,
            durationDays: data.durationDays,
        });
        return response.data;
    },
};

