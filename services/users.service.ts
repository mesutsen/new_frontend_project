import { api } from '@/lib/axios';

export interface User {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLoginDate?: string;
    profilePictureUrl?: string;
    temporaryPassword?: string; // Sadece reset password sonrası döner
}

export interface PagedUserResponse {
    total: number;
    pageNumber: number;
    pageSize: number;
    items: User[];
}

export interface CreateUserRequest {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export interface UpdateUserRequest {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
}

export interface AssignRoleRequest {
    roleIds: string[];
}

export const usersService = {
    /**
     * Get paginated users list
     */
    async getUsers(params: {
        pageNumber?: number;
        pageSize?: number;
        search?: string;
        isActive?: boolean;
    } = {}): Promise<PagedUserResponse> {
        const queryParams = new URLSearchParams();
        if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

        const response = await api.get<PagedUserResponse>(`/users?${queryParams.toString()}`);
        return response.data;
    },

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User> {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    /**
     * Create a new user
     */
    async createUser(request: CreateUserRequest): Promise<{ id: string }> {
        const response = await api.post<{ id: string }>('/users', request);
        return response.data;
    },

    /**
     * Update a user
     */
    async updateUser(id: string, request: UpdateUserRequest): Promise<{ id: string }> {
        const response = await api.put<{ id: string }>(`/users/${id}`, request);
        return response.data;
    },

    /**
     * Delete a user
     */
    async deleteUser(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    /**
     * Activate a user
     */
    async activateUser(id: string): Promise<void> {
        await api.patch(`/users/${id}/activate`);
    },

    /**
     * Deactivate a user
     */
    async deactivateUser(id: string): Promise<void> {
        await api.patch(`/users/${id}/deactivate`);
    },

    /**
     * Get user roles
     */
    async getUserRoles(userId: string): Promise<{ roleIds: string[] }> {
        const response = await api.get<{ roleIds: string[] }>(`/users/${userId}/roles`);
        return response.data;
    },

    /**
     * Assign roles to a user
     */
    async assignRoles(userId: string, roleIds: string[]): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/users/${userId}/roles`, { roleIds });
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        preferredLanguage?: string;
    }> {
        const response = await api.get<{
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber?: string;
            preferredLanguage?: string;
        }>('/users/profile');
        return response.data;
    },

    /**
     * Update current user profile
     */
    async updateProfile(request: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
    }): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        preferredLanguage?: string;
    }> {
        const response = await api.put<{
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber?: string;
            preferredLanguage?: string;
        }>('/users/profile', request);
        return response.data;
    },

    /**
     * Kullanıcı için yeni geçici şifre oluştur
     */
    async resetPassword(id: string): Promise<User> {
        const response = await api.post<User>(`/users/${id}/reset-password`);
        return response.data;
    },
};

