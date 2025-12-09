import { api } from '@/lib/axios';

export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    isDefault: boolean;
    isActive: boolean;
    displayOrder: number;
}

export interface CreateCurrencyRequest {
    code: string;
    name: string;
    symbol: string;
    isDefault: boolean;
    isActive?: boolean;
    displayOrder?: number;
}

export interface UpdateCurrencyRequest {
    name: string;
    symbol: string;
    isDefault: boolean;
    isActive: boolean;
    displayOrder: number;
}

export const currenciesService = {
    async getList(): Promise<Currency[]> {
        const response = await api.get<Currency[]>('/currencies');
        return response.data;
    },

    async getActive(): Promise<Currency[]> {
        const response = await api.get<Currency[]>('/currencies/active');
        return response.data;
    },

    async getDefault(): Promise<Currency | null> {
        try {
            const response = await api.get<Currency>('/currencies/default');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async getById(id: string): Promise<Currency> {
        const response = await api.get<Currency>(`/currencies/${id}`);
        return response.data;
    },

    async getByCode(code: string): Promise<Currency | null> {
        try {
            const response = await api.get<Currency>(`/currencies/code/${code}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async create(data: CreateCurrencyRequest): Promise<Currency> {
        const response = await api.post<Currency>('/currencies', data);
        return response.data;
    },

    async update(id: string, data: UpdateCurrencyRequest): Promise<Currency> {
        const response = await api.put<Currency>(`/currencies/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/currencies/${id}`);
    },
};

