// src/lib/hooks/use-sops.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { Sop, SopType, SopStatus } from '@/lib/types/index';

export const sopsKeys = {
    all: ['sops'] as const,
    list: (filters?: { type?: SopType; status?: SopStatus; search?: string }) => [...sopsKeys.all, 'list', filters] as const,
    approved: () => [...sopsKeys.all, 'approved'] as const,
    pending: () => [...sopsKeys.all, 'pending'] as const,
    stats: () => [...sopsKeys.all, 'stats'] as const,
    detail: (id: string) => [...sopsKeys.all, 'detail', id] as const,
};

// Get all SOPs
export function useSops(filters?: { type?: SopType; status?: SopStatus; search?: string }) {
    return useQuery({
        queryKey: sopsKeys.list(filters),
        queryFn: () => api.get<Sop[]>('/sops', filters),
    });
}

// Get approved SOPs
export function useApprovedSops() {
    return useQuery({
        queryKey: sopsKeys.approved(),
        queryFn: () => api.get<Sop[]>('/sops/approved'),
    });
}

// Get pending SOPs (admin)
export function usePendingSops() {
    return useQuery({
        queryKey: sopsKeys.pending(),
        queryFn: () => api.get<Sop[]>('/sops/pending'),
    });
}

// Get SOP stats (admin)
export function useSopStats() {
    return useQuery({
        queryKey: sopsKeys.stats(),
        queryFn: () => api.get<{ total: number; approved: number; pending: number; rejected: number }>('/sops/stats'),
    });
}

// Get SOP by ID
export function useSop(id: string) {
    return useQuery({
        queryKey: sopsKeys.detail(id),
        queryFn: () => api.get<Sop>(`/sops/${id}`),
        enabled: !!id,
    });
}

// Create SOP
export function useCreateSop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            type: SopType;
            fileUrl: string;
            thumbnailUrl?: string;
            duration?: number;
            tags?: string[];
        }) => api.post<Sop>('/sops', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sopsKeys.all });
        },
    });
}

// Update SOP
export function useUpdateSop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Sop> }) =>
            api.put<Sop>(`/sops/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: sopsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: sopsKeys.all });
        },
    });
}

// Approve SOP
export function useApproveSop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            api.patch<Sop>(`/sops/${id}/approve`, { notes }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: sopsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: sopsKeys.all });
        },
    });
}

// Reject SOP
export function useRejectSop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
            api.patch<Sop>(`/sops/${id}/reject`, { rejectionReason }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: sopsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: sopsKeys.all });
        },
    });
}

// Increment view count
export function useIncrementSopView() {
    return useMutation({
        mutationFn: (id: string) => api.patch<Sop>(`/sops/${id}/view`),
    });
}

// Delete SOP
export function useDeleteSop() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/sops/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sopsKeys.all });
        },
    });
}