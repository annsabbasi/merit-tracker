// src/lib/hooks/use-companies.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { Company, CompanyStats } from '@/lib/types/index';

export const companiesKeys = {
    all: ['companies'] as const,
    myCompany: () => [...companiesKeys.all, 'my-company'] as const,
    stats: () => [...companiesKeys.all, 'stats'] as const,
};

// Get my company
export function useMyCompany() {
    return useQuery({
        queryKey: companiesKeys.myCompany(),
        queryFn: () => api.get<Company>('/companies/my-company'),
    });
}

// Get company stats
export function useCompanyStats() {
    return useQuery({
        queryKey: companiesKeys.stats(),
        queryFn: () => api.get<CompanyStats>('/companies/my-company/stats'),
    });
}

// Update company
export function useUpdateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
            api.put<Company>(`/companies/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companiesKeys.myCompany() });
        },
    });
}