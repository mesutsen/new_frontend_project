'use client';

import * as React from "react"
import { Check } from "lucide-react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

// SVG Flag Components
const TurkeyFlag = () => (
    <svg viewBox="0 0 36 36" className="w-6 h-6">
        <path fill="#E30A17" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z" />
        <circle fill="#FFF" cx="14" cy="18" r="6" />
        <circle fill="#E30A17" cx="15.5" cy="18" r="4.5" />
        <path fill="#FFF" d="m20.5 14.5 1.8 5.5h5.8l-4.7 3.4 1.8 5.5-4.7-3.4-4.7 3.4 1.8-5.5-4.7-3.4h5.8z" transform="scale(0.45) translate(22, 12)" />
    </svg>
);

const UKFlag = () => (
    <svg viewBox="0 0 36 36" className="w-6 h-6">
        <path fill="#00247D" d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z" />
        <path fill="#FFF" d="M0 9.059V13h5.628zM4.664 27H13v-5.837zM23 27h8.335l-5.837-5.837zM0 23.041V27h5.838zM31.337 5H23v5.837zM36 13v-3.941L30.162 13zM13 5H4.664l5.837 5.837zM36 22.959V19h-5.628z" />
        <path fill="#CF142B" d="M25.14 23l9.712 6.801a3.977 3.977 0 0 0 .99-1.749L28.627 23H25.14zM13 23h-2.141l-9.711 6.801c.521.53 1.189.909 1.938 1.085L13 23.943V23zm10-10h2.141l9.711-6.801a3.988 3.988 0 0 0-1.937-1.085L23 12.057V13zm-12.141 0L1.148 6.199a3.978 3.978 0 0 0-.99 1.749L7.373 13h3.486z" />
        <path fill="#FFF" d="M36 21H21v10h11a4 4 0 0 0 4-4v-6zM0 21v6a4 4 0 0 0 4 4h11V21H0zM21 5v10h15V9a4 4 0 0 0-4-4H21zM0 9v6h15V5H4a4 4 0 0 0-4 4z" />
        <path fill="#CF142B" d="M21 15V5h-6v10H0v6h15v10h6V21h15v-6z" />
    </svg>
);

const BulgariaFlag = () => (
    <svg viewBox="0 0 36 36" className="w-6 h-6">
        <path fill="#FFF" d="M32 5H4a4 4 0 0 0-4 4v5h36V9a4 4 0 0 0-4-4z" />
        <path fill="#00966E" d="M0 14h36v8H0z" />
        <path fill="#D62612" d="M4 31h28a4 4 0 0 0 4-4v-5H0v5a4 4 0 0 0 4 4z" />
    </svg>
);

const languages = [
    { code: "tr", name: "Türkçe", Flag: TurkeyFlag },
    { code: "en", name: "English", Flag: UKFlag },
    { code: "bg", name: "Български", Flag: BulgariaFlag },
]

export function LanguageSelectorInline() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const handleLanguageChange = (newLocale: string) => {
        const pathWithoutLocale = pathname.replace(`/${locale}`, '')
        router.push(`/${newLocale}${pathWithoutLocale}`)
    }

    return (
        <div className="flex gap-2 justify-center">
            {languages.map((lang) => (
                <Button
                    key={lang.code}
                    variant={locale === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLanguageChange(lang.code)}
                    className="relative min-w-[100px]"
                >
                    <lang.Flag />
                    <span className="text-sm ml-2">{lang.name}</span>
                    {locale === lang.code && (
                        <Check className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ))}
        </div>
    )
}
