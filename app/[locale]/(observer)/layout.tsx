import { ReactNode } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function ObserverLayout({ children }: { children: ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}

