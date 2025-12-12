// src/lib/hooks/use-time-tracking.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { usersKeys } from './use-users';
import { projectsKeys } from './use-projects';
import type { TimeTracking, ActiveTimerResponse } from '@/lib/types/index';

export const timeTrackingKeys = {
    all: ['time-tracking'] as const,
    list: (filters?: Record<string, unknown>) => [...timeTrackingKeys.all, 'list', filters] as const,
    active: () => [...timeTrackingKeys.all, 'active'] as const,
    mySummary: () => [...timeTrackingKeys.all, 'my-summary'] as const,
    userSummary: (userId: string) => [...timeTrackingKeys.all, 'user-summary', userId] as const,
    projectSummary: (projectId: string) => [...timeTrackingKeys.all, 'project-summary', projectId] as const,
};

// Get active timer
export function useActiveTimer() {
    return useQuery({
        queryKey: timeTrackingKeys.active(),
        queryFn: () => api.get<ActiveTimerResponse>('/time-tracking/active'),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds for cross-device sync
    });
}

// Get time tracking history
export function useTimeTrackingHistory(filters?: { subProjectId?: string; startDate?: string; endDate?: string }) {
    return useQuery({
        queryKey: timeTrackingKeys.list(filters),
        queryFn: () => api.get<TimeTracking[]>('/time-tracking', filters),
    });
}

// Get my time summary
export function useMyTimeSummary() {
    return useQuery({
        queryKey: timeTrackingKeys.mySummary(),
        queryFn: () => api.get<{ entries: TimeTracking[]; summary: { totalSessions: number; totalMinutes: number; totalHours: number; totalFormatted: string } }>('/time-tracking/my-summary'),
    });
}

// Get project time summary
export function useProjectTimeSummary(projectId: string) {
    return useQuery({
        queryKey: timeTrackingKeys.projectSummary(projectId),
        queryFn: () => api.get(`/time-tracking/project/${projectId}/summary`),
        enabled: !!projectId,
    });
}

// Start time tracking
export function useStartTimeTracking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { subProjectId: string; notes?: string }) =>
            api.post<TimeTracking>('/time-tracking/start', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.list() });
        },
    });
}

// Stop time tracking
export function useStopTimeTracking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            api.post<TimeTracking & { pointsEarned: number }>(`/time-tracking/${id}/stop`, { notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.list() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.mySummary() });
            queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
        },
    });
}

// Stop active timer (cross-device)
export function useStopActiveTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notes?: string) =>
            api.post<TimeTracking & { pointsEarned: number }>('/time-tracking/stop-active', { notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.list() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.mySummary() });
            queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
        },
    });
}

// Delete time entry
export function useDeleteTimeEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/time-tracking/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.list() });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.mySummary() });
        },
    });
}