import { api } from '@/lib/axios';

export interface Claim {
    id: string;
    policyId: string;
    claimType: string;
    description: string;
    status: 'Pending' | 'InReview' | 'Approved' | 'Rejected' | 'Closed';
    claimDate: string;
    incidentLocation?: string;
    estimatedDamage?: number;
    createdAt: string;
    updatedAt: string;
    attachments?: ClaimAttachment[];
    notes?: ClaimNote[];
}

export interface ClaimAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
}

export interface ClaimNote {
    id: string;
    note: string;
    isFromCustomer: boolean;
    createdAt: string;
}

export interface CreateClaimRequest {
    policyId: string;
    claimType: string;
    description: string;
    claimDate: string;
    incidentLocation?: string;
    estimatedDamage?: number;
    attachments?: File[];
}

export interface PagedClaimResponse {
    items: Claim[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const claimsService = {
    /**
     * Get paginated claims
     */
    async getClaims(params: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    } = {}): Promise<PagedClaimResponse> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);

        const response = await api.get<PagedClaimResponse>(
            `/claims?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get claim by ID
     */
    async getClaimById(id: string): Promise<Claim> {
        const response = await api.get<Claim>(`/claims/${id}`);
        return response.data;
    },

    /**
     * Create a new claim
     */
    async createClaim(request: CreateClaimRequest): Promise<Claim> {
        const formData = new FormData();
        formData.append('policyId', request.policyId);
        formData.append('claimType', request.claimType);
        formData.append('description', request.description);
        formData.append('claimDate', request.claimDate);
        if (request.incidentLocation) {
            formData.append('incidentLocation', request.incidentLocation);
        }
        if (request.estimatedDamage) {
            formData.append('estimatedDamage', request.estimatedDamage.toString());
        }
        if (request.attachments) {
            request.attachments.forEach((file) => {
                formData.append('attachments', file);
            });
        }

        const response = await api.post<Claim>('/claims', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

