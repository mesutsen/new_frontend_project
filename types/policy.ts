export type PolicyStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Active' | 'Expired' | 'Cancelled';

export interface PolicyDto {
    id: string;
    policyNumber: string;
    dealerId: string;
    customerId: string;
    vehicleId: string;
    customerName: string;
    vehiclePlate: string;
    policyType: string;
    currencyId: string;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
    premium: number;
    dealerCommission: number;
    observerCommission: number;
    issueDate: string; // ISO date string
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    status: PolicyStatus | string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

