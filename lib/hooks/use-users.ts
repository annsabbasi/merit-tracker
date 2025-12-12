// src/lib/hooks/use-users.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { User, UserRole } from '@/lib/types/index';

export const usersKeys = {
    all: ['users'] as const,
    list: () => [...usersKeys.all, 'list'] as const,
    detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
    leaderboard: () => [...usersKeys.all, 'leaderboard'] as const,
};

// Get all users
export function useUsers() {
    return useQuery({
        queryKey: usersKeys.list(),
        queryFn: () => api.get<User[]>('/users'),
    });
}

// Get user by ID
export function useUser(id: string) {
    return useQuery({
        queryKey: usersKeys.detail(id),
        queryFn: () => api.get<User>(`/users/${id}`),
        enabled: !!id,
    });
}

// Get leaderboard
export function useLeaderboard() {
    return useQuery({
        queryKey: usersKeys.leaderboard(),
        queryFn: () => api.get<User[]>('/users/leaderboard'),
    });
}

// Update user
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
            api.put<User>(`/users/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: usersKeys.list() });
        },
    });
}

// Update user role
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
            api.patch<User>(`/users/${id}/role`, { role }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: usersKeys.list() });
        },
    });
}

// Deactivate user
export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<User>(`/users/${id}/deactivate`),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: usersKeys.list() });
        },
    });
}

// Activate user
export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<User>(`/users/${id}/activate`),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: usersKeys.list() });
        },
    });
}