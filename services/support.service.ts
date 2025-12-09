import { api } from '@/lib/axios';

export interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    category: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    attachments?: TicketAttachment[];
    replies?: TicketReply[];
}

export interface TicketAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
}

export interface TicketReply {
    id: string;
    message: string;
    isFromCustomer: boolean;
    createdAt: string;
    attachments?: TicketAttachment[];
}

export interface CreateTicketRequest {
    subject: string;
    message: string;
    category: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    attachments?: File[];
}

export interface CreateTicketReplyRequest {
    message: string;
    attachments?: File[];
}

export interface PagedTicketResponse {
    items: SupportTicket[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const supportService = {
    /**
     * Get paginated support tickets
     */
    async getTickets(params: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    } = {}): Promise<PagedTicketResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);

        const response = await api.get<PagedTicketResponse>(
            `/support/tickets?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get ticket by ID
     */
    async getTicketById(id: string): Promise<SupportTicket> {
        const response = await api.get<SupportTicket>(`/support/tickets/${id}`);
        return response.data;
    },

    /**
     * Create a new support ticket
     */
    async createTicket(request: CreateTicketRequest): Promise<SupportTicket> {
        const formData = new FormData();
        formData.append('subject', request.subject);
        formData.append('message', request.message);
        formData.append('category', request.category);
        if (request.priority) {
            formData.append('priority', request.priority);
        }
        if (request.attachments) {
            request.attachments.forEach((file) => {
                formData.append('attachments', file);
            });
        }

        const response = await api.post<SupportTicket>('/support/tickets', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Add reply to a ticket
     */
    async addReply(ticketId: string, request: CreateTicketReplyRequest): Promise<TicketReply> {
        const formData = new FormData();
        formData.append('message', request.message);
        if (request.attachments) {
            request.attachments.forEach((file) => {
                formData.append('attachments', file);
            });
        }

        const response = await api.post<TicketReply>(
            `/support/tickets/${ticketId}/replies`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /**
     * Close a ticket
     */
    async closeTicket(ticketId: string): Promise<void> {
        await api.patch(`/support/tickets/${ticketId}/close`);
    },
};

