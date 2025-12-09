import { api } from '@/lib/axios';

export interface TwoFactorSetupResult {
    qrCodeUrl?: string;
    manualEntryKey?: string;
    isEnabled: boolean;
}

export const twoFactorService = {
    /**
     * Begin 2FA setup
     */
    async setup(): Promise<TwoFactorSetupResult> {
        const response = await api.post<TwoFactorSetupResult>('/two-factor/setup');
        return response.data;
    },

    /**
     * Verify 2FA code
     */
    async verify(code: string): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>('/two-factor/verify', { code });
        return response.data;
    },

    /**
     * Disable 2FA
     */
    async disable(): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>('/two-factor/disable');
        return response.data;
    },

    /**
     * Send email code
     */
    async sendEmailCode(): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>('/two-factor/email/send');
        return response.data;
    },

    /**
     * Verify email code
     */
    async verifyEmailCode(code: string): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>('/two-factor/email/verify', { code });
        return response.data;
    },
};

