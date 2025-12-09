import { api } from '@/lib/axios';

export interface Vehicle {
    id: string;
    customerId: string;
    plateNumber: string;
    brand?: string;
    model?: string;
    modelYear?: number;
    vin?: string;
    registrationImageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PagedVehicleResponse {
    items: Vehicle[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateVehicleRequest {
    customerId: string;
    plateNumber: string;
    brand?: string;
    model?: string;
    modelYear?: number;
    vin?: string;
}

export interface UpdateVehicleRequest {
    plateNumber: string;
    brand?: string;
    model?: string;
    modelYear?: number;
    vin?: string;
    isActive: boolean;
}

export interface UploadDocumentResponse {
    url: string;
}

export const vehiclesService = {
    /**
     * Araçları listele (pagination, search, filter)
     */
    getVehicles: async (params?: {
        search?: string;
        customerId?: string;
        page?: number;
        pageSize?: number;
    }): Promise<PagedVehicleResponse> => {
        const response = await api.get<PagedVehicleResponse>('/vehicles', { params });
        return response.data;
    },

    /**
     * Müşteriye ait araçları getir
     */
    getVehiclesByCustomer: async (
        customerId: string,
        params?: {
            search?: string;
            page?: number;
            pageSize?: number;
        }
    ): Promise<PagedVehicleResponse> => {
        const response = await api.get<PagedVehicleResponse>(`/vehicles/customer/${customerId}`, { params });
        return response.data;
    },

    /**
     * Araç detayını getir
     */
    getVehicleById: async (id: string): Promise<Vehicle> => {
        const response = await api.get<Vehicle>(`/vehicles/${id}`);
        return response.data;
    },

    /**
     * Yeni araç oluştur
     */
    createVehicle: async (data: CreateVehicleRequest): Promise<Vehicle> => {
        const response = await api.post<Vehicle>('/vehicles', data);
        return response.data;
    },

    /**
     * Araç güncelle
     */
    updateVehicle: async (id: string, data: UpdateVehicleRequest): Promise<Vehicle> => {
        const response = await api.put<Vehicle>(`/vehicles/${id}`, data);
        return response.data;
    },

    /**
     * Araç sil
     */
    deleteVehicle: async (id: string): Promise<void> => {
        await api.delete(`/vehicles/${id}`);
    },

    /**
     * Araç dokümanı yükle (ruhsat vs.)
     */
    uploadDocument: async (id: string, file: File): Promise<UploadDocumentResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<UploadDocumentResponse>(`/vehicles/${id}/upload-document`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Markaları getir
     */
    getBrands: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/vehicles/brands');
        return response.data;
    },

    /**
     * Markaya ait modelleri getir
     */
    getModels: async (brand: string): Promise<string[]> => {
        const response = await api.get<string[]>(`/vehicles/brands/${encodeURIComponent(brand)}/models`);
        return response.data;
    },
};

