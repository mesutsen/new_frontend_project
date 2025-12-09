'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, accessToken: string, refreshToken: string, requiresPasswordChange?: boolean) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Validate that user has required fields
                if (parsedUser.id && parsedUser.userName && Array.isArray(parsedUser.roles)) {
                    setUser(parsedUser);
                } else {
                    console.warn('Invalid user data structure, clearing storage');
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            } catch (e) {
                console.error('Failed to parse user from local storage');
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newUser: User, accessToken: string, refreshToken: string, requiresPasswordChange = false) => {
        // Store tokens and user data in localStorage first
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(newUser));
            
            // Verify tokens are stored before redirecting
            const storedToken = localStorage.getItem('accessToken');
            if (!storedToken || storedToken !== accessToken) {
                console.error('Failed to store access token in localStorage');
                return;
            }
        }
        
        setUser(newUser);

        // Extract locale from current pathname
        const locale = pathname.split('/')[1] || 'tr';

        // Determine redirect path based on role
        let redirectPath = `/${locale}`;
        
        if (requiresPasswordChange) {
            redirectPath = `/${locale}/change-password`;
        } else {
            const roles = newUser.roles || [];
            if (roles.includes('SuperAdmin')) {
                redirectPath = `/${locale}/superadmin/dashboard`;
            } else if (roles.includes('Admin')) {
                redirectPath = `/${locale}/admin/dashboard`;
            } else if (roles.includes('Dealer')) {
                redirectPath = `/${locale}/dealer/dashboard`;
            } else if (roles.includes('Customer')) {
                redirectPath = `/${locale}/customer/policies`;
            } else if (roles.includes('Observer')) {
                redirectPath = `/${locale}/observer/dashboard`;
            }
        }

        // Use window.location.href for reliable redirect
        // This ensures a full page reload which clears any stale state
        // and guarantees the redirect happens
        // Small delay to ensure localStorage is written
        if (typeof window !== 'undefined') {
            // Use setTimeout to ensure localStorage write is complete
            setTimeout(() => {
                window.location.href = redirectPath;
            }, 100);
        } else {
            router.replace(redirectPath);
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);

        const locale = pathname.split('/')[1] || 'tr';
        router.push(`/${locale}/login`);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
