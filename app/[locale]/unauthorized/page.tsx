import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-10 h-10 text-destructive" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                <p className="text-muted-foreground">
                    You do not have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild variant="outline">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
