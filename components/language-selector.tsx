"use client"

import * as React from "react"
import { Check, Globe } from "lucide-react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "bg", name: "Български" },
]

export function LanguageSelector() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const handleLanguageChange = (newLocale: string) => {
        // Remove the current locale from the pathname
        const pathWithoutLocale = pathname.replace(`/${locale}`, '')
        // Navigate to the new locale
        router.push(`/${newLocale}${pathWithoutLocale}`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className="justify-between"
                    >
                        {lang.name}
                        {locale === lang.code && <Check className="ml-2 h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
