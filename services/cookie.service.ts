/**
 * Cookie yönetim servisi
 * GDPR/KVKK uyumlu cookie tercih yönetimi
 */

const COOKIE_CONSENT_KEY = 'cookieConsent.v1';

export interface CookiePreferences {
    necessary: boolean; // Her zaman true (zorunlu)
    analytics: boolean;
    marketing: boolean;
    acceptedAt: string;
}

export const cookieService = {
    /**
     * Cookie tercihlerini al
     */
    getPreferences(): CookiePreferences | null {
        if (typeof window === 'undefined') return null;
        
        try {
            const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (!saved) return null;
            
            const parsed = JSON.parse(saved) as CookiePreferences;
            return parsed;
        } catch {
            return null;
        }
    },

    /**
     * Cookie tercihlerini kaydet
     */
    savePreferences(preferences: CookiePreferences): void {
        if (typeof window === 'undefined') return;
        
        const consent = {
            ...preferences,
            necessary: true, // Her zaman true
            acceptedAt: new Date().toISOString(),
        };
        
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    },

    /**
     * Cookie tercihlerini backend'e kaydet (login sonrası)
     * @param token JWT token
     */
    async syncToBackend(token: string): Promise<void> {
        const preferences = this.getPreferences();
        if (!preferences) return;

        try {
            // GDPR servisi üzerinden cookie tercihlerini kaydet
            const { gdprService } = await import('./gdpr.service');
            await gdprService.setConsent(
                {
                    purpose: 'cookie_preferences',
                    granted: true,
                    metadata: {
                        preferences: {
                            analytics: preferences.analytics,
                            marketing: preferences.marketing,
                        },
                        acceptedAt: preferences.acceptedAt,
                    },
                },
                token
            );
        } catch (error) {
            console.warn('Cookie tercihleri backend\'e kaydedilemedi:', error);
            // Sessizce devam et, localStorage'da zaten kayıtlı
        }
    },

    /**
     * Analitik çerezler aktif mi?
     */
    isAnalyticsEnabled(): boolean {
        const prefs = this.getPreferences();
        return prefs?.analytics ?? false;
    },

    /**
     * Pazarlama çerezleri aktif mi?
     */
    isMarketingEnabled(): boolean {
        const prefs = this.getPreferences();
        return prefs?.marketing ?? false;
    },

    /**
     * Cookie tercihleri kaydedilmiş mi?
     */
    hasConsent(): boolean {
        return this.getPreferences() !== null;
    },
};

