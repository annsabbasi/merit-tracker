// src/lib/hooks/use-departments.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { Department } from '@/lib/types/index';

export const departmentsKeys = {
    all: ['departments'] as const,
    list: () => [...departmentsKeys.all, 'list'] as const,
    detail: (id: string) => [...departmentsKeys.all, 'detail', id] as const,
};

// Get all departments
export function useDepartments() {
    return useQuery({
        queryKey: departmentsKeys.list(),
        queryFn: () => api.get<Department[]>('/departments'),
    });
}

// Get department by ID
export function useDepartment(id: string) {
    return useQuery({
        queryKey: departmentsKeys.detail(id),
        queryFn: () => api.get<Department>(`/departments/${id}`),
        enabled: !!id,
    });
}

// Create department
export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; description?: string; tag?: string; leadId?: string }) =>
            api.post<Department>('/departments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
        },
    });
}

// Update department
export function useUpdateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
            api.put<Department>(`/departments/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
        },
    });
}

// Assign users to department
export function useAssignUsersToDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<Department>(`/departments/${id}/assign-users`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
        },
    });
}

// Delete department
export function useDeleteDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/departments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
        },
    });
}