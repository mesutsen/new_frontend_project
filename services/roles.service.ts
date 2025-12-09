import { api } from '@/lib/axios';

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
    permissionIds: string[];
}

export interface UpdateRoleRequest {
    name: string;
    description?: string;
    permissionIds: string[];
}

export interface UpdateRolePermissionsRequest {
    permissionIds: string[];
}

export const rolesService = {
    /**
     * Get all roles
     */
    async getAllRoles(): Promise<Role[]> {
        const response = await api.get<Role[]>('/roles');
        return response.data;
    },

    /**
     * Get role by ID
     */
    async getRoleById(id: string): Promise<Role> {
        const response = await api.get<Role>(`/roles/${id}`);
        return response.data;
    },

    /**
     * Create a new role
     */
    async createRole(request: CreateRoleRequest): Promise<Role> {
        const response = await api.post<Role>('/roles', request);
        return response.data;
    },

    /**
     * Update a role
     */
    async updateRole(id: string, request: UpdateRoleRequest): Promise<Role> {
        const response = await api.put<Role>(`/roles/${id}`, request);
        return response.data;
    },

    /**
     * Delete a role
     */
    async deleteRole(id: string): Promise<void> {
        await api.delete(`/roles/${id}`);
    },

    /**
     * Get role permissions
     */
    async getRolePermissions(id: string): Promise<Permission[]> {
        const response = await api.get<Permission[]>(`/roles/${id}/permissions`);
        return response.data;
    },

    /**
     * Update role permissions
     */
    async updateRolePermissions(id: string, request: UpdateRolePermissionsRequest): Promise<void> {
        await api.put(`/roles/${id}/permissions`, request);
    },

    /**
     * Get all permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        const response = await api.get<Permission[]>('/roles/permissions/all');
        return response.data;
    },
};

