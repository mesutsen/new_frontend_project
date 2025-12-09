'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '@/services/maintenance.service';
import { useAuth } from '@/components/providers/auth-provider';

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

    // Check maintenance status every 30 seconds
    const { data: status } = useQuery({
        queryKey: ['maintenanceStatus'],
        queryFn: () => maintenanceService.getStatus(),
        refetchInterval: 30000,
        retry: false,
    });

    useEffect(() => {
        if (!status?.isActive || !status.affectedPortals) return;

        // Check if user is Admin or SuperAdmin - they should always bypass maintenance
        const userRoles = user?.roles || [];
        const isAdmin = userRoles.some((role: string) => 
            role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin'
        );

        // Determine current portal based on pathname
        let currentPortal = '';
        if (pathname.includes('/admin') || pathname.includes('/superadmin')) currentPortal = 'admin';
        else if (pathname.includes('/dealer')) currentPortal = 'dealer';
        else if (pathname.includes('/customer')) currentPortal = 'customer';
        else if (pathname.includes('/observer')) currentPortal = 'observer';

        // Always allow access to maintenance management page and admin pages for admin users
        const isMaintenanceManagementPage = pathname.includes('/system/maintenance');
        if (isMaintenanceManagementPage || isAdmin) {
            return;
        }

        // If we are already on the maintenance display page, don't redirect
        if (pathname.includes('/maintenance') && !isMaintenanceManagementPage) {
            // If maintenance is over, redirect back to dashboard
            if (!status.isActive || (currentPortal && !status.affectedPortals.includes(currentPortal))) {
                router.push('/');
            }
            return;
        }

        // If current portal is affected, redirect to maintenance page
        if (currentPortal && status.affectedPortals.includes(currentPortal)) {
            const params = new URLSearchParams();
            if (status.message) params.set('message', status.message);
            if (status.until) params.set('until', status.until);

            router.push(`/${pathname.split('/')[1]}/maintenance?${params.toString()}`);
        }
    }, [status, pathname, router, user]);

    return <>{children}</>;
}
