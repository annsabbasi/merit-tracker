// src/lib/hooks/use-notifications.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { Notification, NotificationType } from '@/lib/types/index';

export const notificationsKeys = {
    all: ['notifications'] as const,
    list: (filters?: { type?: NotificationType; unreadOnly?: boolean }) => [...notificationsKeys.all, 'list', filters] as const,
    unreadCount: () => [...notificationsKeys.all, 'unread-count'] as const,
};

// Get notifications
export function useNotifications(filters?: { type?: NotificationType; unreadOnly?: boolean }) {
    return useQuery({
        queryKey: notificationsKeys.list(filters),
        queryFn: () => api.get<Notification[]>('/notifications', filters),
    });
}

// Get unread count
export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: notificationsKeys.unreadCount(),
        queryFn: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
        refetchInterval: 30 * 1000, // Poll every 30 seconds
    });
}

// Mark as read
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}

// Mark all as read
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}

// Delete notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/notifications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}

// Clear all read notifications
export function useClearReadNotifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.delete('/notifications/clear-read'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        },
    });
}