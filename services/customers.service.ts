import { api } from '@/lib/axios';

export interface Customer {
    id: string;
    dealerId: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PagedCustomerResponse {
    items: Customer[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateCustomerRequest {
    dealerId: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
    email?: string;
    phone?: string;
}

export interface UpdateCustomerRequest {
    firstName: string;
    lastName: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export const customersService = {
    /**
     * Get paginated customers list
     */
    async getCustomers(params: {
        search?: string;
        dealerId?: string;
        page?: number;
        pageSize?: number;
    } = {}): Promise<PagedCustomerResponse> {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.dealerId) queryParams.append('dealerId', params.dealerId);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedCustomerResponse>(
            `/customers?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get customers by dealer
     */
    async getCustomersByDealer(
        dealerId: string,
        params: {
            search?: string;
            page?: number;
            pageSize?: number;
        } = {}
    ): Promise<PagedCustomerResponse> {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedCustomerResponse>(
            `/customers/dealer/${dealerId}?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get customer by ID
     */
    async getCustomerById(id: string): Promise<Customer> {
        const response = await api.get<Customer>(`/customers/${id}`);
        return response.data;
    },

    /**
     * Create a new customer
     */
    async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
        const response = await api.post<Customer>('/customers', request);
        return response.data;
    },

    /**
     * Update a customer
     */
    async updateCustomer(id: string, request: UpdateCustomerRequest): Promise<Customer> {
        const response = await api.put<Customer>(`/customers/${id}`, request);
        return response.data;
    },

    /**
     * Delete a customer
     */
    async deleteCustomer(id: string): Promise<void> {
        await api.delete(`/customers/${id}`);
    },

    /**
     * Search customers
     */
    async searchCustomers(params: {
        name?: string;
        nationalId?: string;
        phone?: string;
    }): Promise<Customer[]> {
        const queryParams = new URLSearchParams();
        if (params.name) queryParams.append('name', params.name);
        if (params.nationalId) queryParams.append('nationalId', params.nationalId);
        if (params.phone) queryParams.append('phone', params.phone);

        const response = await api.get<Customer[]>(
            `/customers/search?${queryParams.toString()}`
        );
        return response.data;
    },
};

