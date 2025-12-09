'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    {
        id: '1',
        question: 'Poliçemi nasıl yenileyebilirim?',
        answer: 'Poliçenizi yenilemek için "Poliçelerim" sayfasından ilgili poliçeyi seçip "Yenile" butonuna tıklayabilirsiniz. Alternatif olarak müşteri hizmetlerimizle iletişime geçebilirsiniz.',
        category: 'Policy',
    },
    {
        id: '2',
        question: 'Hasar bildirimi nasıl yapılır?',
        answer: 'Hasar bildirimi yapmak için "Hasar Bildirimi" sayfasına gidin, gerekli bilgileri doldurun ve fotoğraf/video ekleyin. Bildiriminiz en kısa sürede değerlendirilecektir.',
        category: 'Claim',
    },
    {
        id: '3',
        question: 'Ödeme yöntemleri nelerdir?',
        answer: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Online ödeme için güvenli ödeme sistemlerimizi kullanıyoruz.',
        category: 'Payment',
    },
    {
        id: '4',
        question: 'Poliçe belgemi nasıl indirebilirim?',
        answer: 'Poliçe detay sayfasından "PDF İndir" butonuna tıklayarak poliçe belgenizi indirebilirsiniz.',
        category: 'Policy',
    },
    {
        id: '5',
        question: 'Hesap bilgilerimi nasıl güncelleyebilirim?',
        answer: 'Profil sayfasından kişisel bilgilerinizi güncelleyebilirsiniz. E-posta ve telefon numaranızı değiştirmek için "Düzenle" butonuna tıklayın.',
        category: 'General',
    },
    {
        id: '6',
        question: 'Acil durumlarda nasıl iletişime geçebilirim?',
        answer: 'Acil durumlar için 7/24 hattımızı arayabilirsiniz: +90 (212) 123 45 67. Ayrıca acil durum bildirimi sayfasından da hızlıca başvurabilirsiniz.',
        category: 'General',
    },
];

export default function CustomerFAQPage() {
    const t = useTranslations('Support');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredFAQs = faqData.filter((faq) => {
        const matchesSearch =
            faq.question.toLowerCase().includes(search.toLowerCase()) ||
            faq.answer.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', 'General', 'Policy', 'Claim', 'Payment'];

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <HelpCircle className="h-8 w-8" />
                        {t('faq') || 'Sıkça Sorulan Sorular'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('faqDescription') || 'Merak ettiğiniz soruların cevaplarını burada bulabilirsiniz'}
                    </p>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('searchFaq') || 'SSS Ara'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchPlaceholder') || 'Sorunuzu yazın...'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="all">{t('allCategories') || 'Tüm Kategoriler'}</option>
                                <option value="General">{t('categoryGeneral') || 'Genel'}</option>
                                <option value="Policy">{t('categoryPolicy') || 'Poliçe'}</option>
                                <option value="Claim">{t('categoryClaim') || 'Hasar'}</option>
                                <option value="Payment">{t('categoryPayment') || 'Ödeme'}</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* FAQ List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('faqResults') || 'Sonuçlar'} ({filteredFAQs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredFAQs.length > 0 ? (
                            <div className="space-y-2">
                                {filteredFAQs.map((faq) => (
                                    <Collapsible key={faq.id}>
                                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted">
                                            <span className="font-medium">{faq.question}</span>
                                            <span className="text-muted-foreground">▼</span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                                            {faq.answer}
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    {t('noFaqResults') || 'Aradığınız kriterlere uygun sonuç bulunamadı.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

