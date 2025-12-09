'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
    { image: '/hero-1.png', titleKey: 'slide1Title', descKey: 'slide1Description' },
    { image: '/hero-2.png', titleKey: 'slide2Title', descKey: 'slide2Description' },
    { image: '/hero-3.png', titleKey: 'slide3Title', descKey: 'slide3Description' },
];

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('LoginSlider');
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image Slider */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${slide.image})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        </div>

                        {/* Caption - Windows Lock Screen Style */}
                        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
                            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
                                {t(slide.titleKey as any)}
                            </h2>
                            <p className="text-lg text-white/90 max-w-2xl drop-shadow-md">
                                {t(slide.descKey as any)}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                    onClick={prevSlide}
                >
                    <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                    onClick={nextSlide}
                >
                    <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Slide Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all ${index === currentSlide
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/75'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-8 h-8 text-primary-foreground"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Ersin Sigorta</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Insurance Management System
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
