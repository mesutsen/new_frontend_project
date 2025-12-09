import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <FileQuestion className="w-10 h-10 text-muted-foreground" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
                <p className="text-muted-foreground">
                    The page you are looking for does not exist or has been moved.
                </p>
                <div className="flex justify-center">
                    <Button asChild>
                        <Link href="/">Return Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
