import { api } from '@/lib/axios';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'InProgress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    assignedToUserId: string;
    assignedToUserName?: string;
    createdByUserId: string;
    createdByUserName?: string;
    relatedDealerId?: string;
    relatedDealerName?: string;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

export interface CreateTaskRequest {
    title: string;
    description: string;
    assignedToUserId: string;
    relatedDealerId?: string;
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High';
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: 'Pending' | 'InProgress' | 'Completed';
    priority?: 'Low' | 'Medium' | 'High';
    assignedToUserId?: string;
    relatedDealerId?: string;
    dueDate?: string;
}

export interface PagedTaskResponse {
    items: Task[];
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number;
}

export interface TaskListParams {
    assignedToUserId?: string;
    status?: 'Pending' | 'InProgress' | 'Completed';
    priority?: 'Low' | 'Medium' | 'High';
    page?: number;
    pageSize?: number;
}

export const tasksAdminService = {
    /**
     * Get all tasks (paginated)
     */
    async getTasks(params: TaskListParams = {}): Promise<PagedTaskResponse> {
        const queryParams = new URLSearchParams();
        if (params.assignedToUserId) queryParams.append('assignedToUserId', params.assignedToUserId);
        if (params.status) queryParams.append('status', params.status);
        if (params.priority) queryParams.append('priority', params.priority);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedTaskResponse>(`/admin/tasks?${queryParams.toString()}`);
        
        const data = response.data;
        // Backend'den totalPages gelmiyorsa hesapla
        if (!data.totalPages && data.pageSize) {
            data.totalPages = Math.ceil(data.total / data.pageSize);
        }
        
        return data;
    },

    /**
     * Get task by ID
     */
    async getTaskById(id: string): Promise<Task> {
        const response = await api.get<Task>(`/admin/tasks/${id}`);
        return response.data;
    },

    /**
     * Create a new task
     */
    async createTask(data: CreateTaskRequest): Promise<Task> {
        const response = await api.post<Task>('/admin/tasks', data);
        return response.data;
    },

    /**
     * Update task
     */
    async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
        const response = await api.put<Task>(`/admin/tasks/${id}`, data);
        return response.data;
    },

    /**
     * Delete task
     */
    async deleteTask(id: string): Promise<void> {
        await api.delete(`/admin/tasks/${id}`);
    },
};
