'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';

interface CredentialsFieldProps {
    value: string;
    label: string;
    isPassword?: boolean;
}

export function CredentialsField({ value, label, isPassword = false }: CredentialsFieldProps) {
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            // Fallback: Eski tarayıcılar için
            const textArea = document.createElement('textarea');
            textArea.value = value;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textArea);
        }
    };

    const displayValue = isPassword && !showPassword ? '•'.repeat(value.length) : value;

    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">
                {displayValue}
            </div>
            {isPassword && (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0"
                    title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </Button>
            )}
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
                title="Kopyala"
            >
                {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                ) : (
                    <Copy className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}

