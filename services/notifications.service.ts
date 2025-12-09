import { api } from '@/lib/axios';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface PagedNotificationResponse {
    items: Notification[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateNotificationRequest {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, string>;
}

export const notificationsService = {
    /**
     * Get paginated notifications list
     */
    async getNotifications(params: {
        page?: number;
        pageSize?: number;
    } = {}): Promise<PagedNotificationResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

        const response = await api.get<PagedNotificationResponse>(
            `/notifications?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get notification by ID
     */
    async getNotificationById(id: string): Promise<Notification> {
        const response = await api.get<Notification>(`/notifications/${id}`);
        return response.data;
    },

    /**
     * Mark notification as read
     */
    async markAsRead(id: string): Promise<void> {
        await api.patch(`/notifications/${id}/mark-as-read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await api.patch('/notifications/mark-all-as-read');
    },

    /**
     * Get unread notifications count
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get<number>('/notifications/unread-count');
        return response.data;
    },

    /**
     * Create a new notification (Admin only)
     */
    async createNotification(request: CreateNotificationRequest): Promise<Notification> {
        const response = await api.post<Notification>('/notifications', request);
        return response.data;
    },
};

