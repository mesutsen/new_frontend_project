import axios from '@/lib/axios';
import { api } from '@/lib/axios';
import { PagedResponse } from './common';

export interface PolicyType {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    defaultDealerCommissionRate: number;
    defaultObserverCommissionRate: number;
    defaultAdminCommissionRate: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePolicyTypeRequest {
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    defaultDealerCommissionRate: number;
    defaultObserverCommissionRate: number;
    defaultAdminCommissionRate: number;
}

export interface UpdatePolicyTypeRequest {
    name: string;
    description?: string;
    isActive: boolean;
    defaultDealerCommissionRate: number;
    defaultObserverCommissionRate: number;
    defaultAdminCommissionRate: number;
}

export interface PolicyTypeListParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

export const policyTypesService = {
    async getList(params?: PolicyTypeListParams): Promise<PagedResponse<PolicyType>> {
        const response = await api.get<PagedResponse<PolicyType>>('/policy-types', { params });
        return response.data;
    },

    async getActive(): Promise<PolicyType[]> {
        const response = await api.get<PolicyType[]>('/policy-types/active');
        return response.data;
    },

    async getById(id: string): Promise<PolicyType> {
        const response = await api.get<PolicyType>(`/policy-types/${id}`);
        return response.data;
    },

    async getByCode(code: string): Promise<PolicyType | null> {
        try {
            const response = await api.get<PolicyType>(`/policy-types/code/${code}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async create(data: CreatePolicyTypeRequest): Promise<PolicyType> {
        const response = await api.post<PolicyType>('/policy-types', data);
        return response.data;
    },

    async update(id: string, data: UpdatePolicyTypeRequest): Promise<PolicyType> {
        const response = await api.put<PolicyType>(`/policy-types/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/policy-types/${id}`);
    },
};

