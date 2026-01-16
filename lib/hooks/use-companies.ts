// src/lib/hooks/use-companies.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api/request';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Company, CompanyStats } from '@/lib/types/index';

export const companiesKeys = {
    all: ['companies'] as const,
    myCompany: () => [...companiesKeys.all, 'my-company'] as const,
    stats: () => [...companiesKeys.all, 'stats'] as const,
};

// Extended Company type with helper fields
export interface CompanyWithHelpers extends Company {
    canChangeName: boolean;
    logoUpload?: {
        url: string;
        path: string;
        size: number;
    };
}

// Get my company
export function useMyCompany() {
    return useQuery({
        queryKey: companiesKeys.myCompany(),
        queryFn: () => api.get<CompanyWithHelpers>('/companies/my-company'),
    });
}

// Get company stats
export function useCompanyStats() {
    return useQuery({
        queryKey: companiesKeys.stats(),
        queryFn: () => api.get<CompanyStats & { canChangeName: boolean; nameChangedAt: string | null }>('/companies/my-company/stats'),
    });
}

// Update company (general updates - name change restricted)
export function useUpdateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: {
                name?: string;
                address?: string;
                phone?: string;
                website?: string;
                screenCaptureEnabled?: boolean;
            }
        }) => api.put<CompanyWithHelpers>(`/companies/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companiesKeys.myCompany() });
            queryClient.invalidateQueries({ queryKey: companiesKeys.stats() });
        },
    });
}

// Update company name (one-time only)
export function useUpdateCompanyName() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) =>
            api.patch<CompanyWithHelpers & { message: string }>(`/companies/${id}/name`, { name }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: companiesKeys.myCompany() });
            queryClient.invalidateQueries({ queryKey: companiesKeys.stats() });
            // Update auth store with new company name
            if (data) {
                useAuthStore.getState().setCompany({
                    id: data.id,
                    name: data.name,
                    companyCode: data.companyCode,
                    logo: data.logo,
                    screenCaptureEnabled: data.screenCaptureEnabled,
                });
            }
        },
    });
}

// Upload company logo
export function useUploadCompanyLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, file }: { id: string; file: File }) => {
            const formData = new FormData();
            formData.append('file', file);

            const token = useAuthStore.getState().token;

            const response = await fetch(`${BASE_URL}/companies/${id}/logo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload logo');
            }

            return response.json() as Promise<CompanyWithHelpers>;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: companiesKeys.myCompany() });
            // Update auth store with new logo
            if (data) {
                useAuthStore.getState().setCompany({
                    id: data.id,
                    name: data.name,
                    companyCode: data.companyCode,
                    logo: data.logo,
                    screenCaptureEnabled: data.screenCaptureEnabled,
                });
            }
        },
    });
}

// Remove company logo
export function useRemoveCompanyLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.delete<CompanyWithHelpers & { message: string }>(`/companies/${id}/logo`),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: companiesKeys.myCompany() });
            // Update auth store
            if (data) {
                useAuthStore.getState().setCompany({
                    id: data.id,
                    name: data.name,
                    companyCode: data.companyCode,
                    logo: data.logo,
                    screenCaptureEnabled: data.screenCaptureEnabled,
                });
            }
        },
    });
}