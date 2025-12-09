'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usersService } from '@/services/users.service';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2, Save, Edit, User, Phone, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordModal } from '@/components/account/change-password-modal';

export default function CustomerProfilePage() {
    const t = useTranslations('Profile');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        preferredLanguage: '',
    });
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['user-profile', user?.id],
        queryFn: () => usersService.getProfile(),
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (data) {
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                preferredLanguage: data.preferredLanguage || locale,
            });
        }
    }, [data, locale]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return usersService.updateProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            setIsEditing(false);
            toast.success(t('updateSuccess') || 'Profil başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t('updateError') || 'Profil güncellenirken hata oluştu');
        },
    });

    const handleSave = () => {
        updateProfileMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{t('title') || 'Profil'}</h1>
                    <p className="text-muted-foreground">{t('errorMessage') || 'Profil bilgileri yüklenirken hata oluştu.'}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('title') || 'Profil Yönetimi'}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('description') || 'Hesap bilgilerinizi görüntüleyin ve düzenleyin'}
                    </p>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('personalInfo') || 'Kişisel Bilgiler'}</CardTitle>
                            <CardDescription>{t('personalInfoDescription') || 'Kişisel bilgilerinizi güncelleyin'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> {t('firstName') || 'Ad'}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.firstName || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> {t('lastName') || 'Soyad'}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.lastName || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> {t('email') || 'E-posta'}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.email || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> {t('phoneNumber') || 'Telefon'}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.phoneNumber || '-'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preferredLanguage" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> {t('preferredLanguage') || 'Tercih Edilen Dil'}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        id="preferredLanguage"
                                        value={formData.preferredLanguage}
                                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                        disabled
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.preferredLanguage || locale}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            {tCommon('cancel') || 'İptal'}
                                        </Button>
                                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                                            {updateProfileMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            {tCommon('save') || 'Kaydet'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        {t('edit') || 'Düzenle'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('security') || 'Şifre ve Güvenlik'}</CardTitle>
                            <CardDescription>
                                {t('securityDescription') || 'Şifrenizi düzenli olarak değiştirerek hesabınızı güvende tutun.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={() => setShowChangePasswordModal(true)} variant="outline">
                                {t('changePassword') || 'Şifre Değiştir'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {showChangePasswordModal && (
                    <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
                )}
            </div>
        </DashboardLayout>
    );
}

