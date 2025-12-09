'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { usersService } from '@/services/users.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Edit, User, Phone, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';

export default function DealerProfilePage() {
    const t = useTranslations('Profile');
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
                preferredLanguage: data.preferredLanguage || 'tr-TR',
            });
        }
    }, [data]);

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
            toast.success('Profil başarıyla güncellendi');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Profil güncellenirken hata oluştu');
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Profil Yönetimi</h1>
                    <p className="text-muted-foreground mt-1">Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kişisel Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" /> Ad
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.firstName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" /> Soyad
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, lastName: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.lastName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> E-posta
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Telefon
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phoneNumber: e.target.value })
                                        }
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.phoneNumber}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> Tercih Edilen Dil
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.preferredLanguage}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                preferredLanguage: e.target.value,
                                            })
                                        }
                                    />
                                ) : (
                                    <p className="text-muted-foreground">{formData.preferredLanguage}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            İptal
                                        </Button>
                                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                                            {updateProfileMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Kaydet
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Düzenle
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Şifre ve Güvenlik</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Şifrenizi düzenli olarak değiştirerek hesabınızı güvende tutun.
                            </p>
                            <Button onClick={() => {}}>Şifre Değiştir</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

