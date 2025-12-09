import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://5.245.250.23:5000/api';

console.log('API Base URL:', baseURL); // Debug log

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
            // Token'ı temizle (başında/sonunda boşluk varsa)
            const cleanToken = token.trim();
            config.headers.Authorization = `Bearer ${cleanToken}`;
            
            // Debug: Token'ın ilk kısmını logla (production'da kapatılabilir)
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.debug('Request with token:', config.url, 'Token preview:', cleanToken.substring(0, 20) + '...');
            }
        } else {
            // Debug: Log when token is missing
            if (typeof window !== 'undefined' && config.url && !config.url.includes('/auth/login') && !config.url.includes('/auth/refresh-token') && !config.url.includes('/maintenance')) {
                console.warn('No access token found for request:', config.url);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized (Token expired)
        // IMPORTANT: Don't try to refresh token for login/refresh-token endpoints
        // These endpoints don't require authentication, so 401 means invalid credentials
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/refresh-token') ||
                              originalRequest.url?.includes('/auth/forgot-password') ||
                              originalRequest.url?.includes('/auth/reset-password');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            // Log 401 error details for debugging
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.warn('401 Unauthorized:', {
                    url: originalRequest.url,
                    method: originalRequest.method,
                    hasToken: !!localStorage.getItem('accessToken'),
                    tokenPreview: localStorage.getItem('accessToken')?.substring(0, 20) + '...',
                    errorData: error.response?.data
                });
            }

            const refreshToken = localStorage.getItem('refreshToken');
            
            // If no refresh token, logout immediately
            if (!refreshToken) {
                console.warn('No refresh token available, logging out');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'tr' : 'tr';
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = `/${locale}/login`;
                }
                return Promise.reject(error);
            }

            try {
                // Call refresh token endpoint
                // We use a separate axios instance to avoid infinite loops if this fails
                const response = await axios.post(`${baseURL}/auth/refresh-token`, {
                    refreshToken,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const { accessToken, refreshToken: newRefreshToken, user } = response.data;

                if (!accessToken) {
                    throw new Error('No access token in refresh response');
                }

                // Update tokens and user in localStorage
                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                }

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError: any) {
                // Refresh token failed - log error but don't immediately logout
                // The original 401 error will be returned, and the component can handle it
                console.error('Token refresh failed:', refreshError?.response?.data || refreshError?.message);
                
                // Only logout if refresh token endpoint explicitly says token is invalid
                // Otherwise, let the component handle the 401 error
                const isTokenInvalid = refreshError?.response?.status === 401 || 
                                      refreshError?.response?.status === 400 ||
                                      refreshError?.message?.includes('Geçersiz') ||
                                      refreshError?.message?.includes('expired');
                
                if (isTokenInvalid) {
                    console.warn('Refresh token is invalid, logging out');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'tr' : 'tr';
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = `/${locale}/login`;
                    }
                }
                
                // Return the original 401 error so the component can handle it
                return Promise.reject(error);
            }
        }

        // Handle 403 Forbidden (might be IP restriction or other auth issues)
        if (error.response?.status === 403) {
            console.error('403 Forbidden:', error.response?.data);
            // Don't auto-logout on 403, let the component handle it
        }

        return Promise.reject(error);
    }
);
