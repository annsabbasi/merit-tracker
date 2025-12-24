// src/lib/hooks/use-activity-logs.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { ActivityType } from '@/lib/types/index';

// Activity Log Type
export interface ActivityLog {
    id: string;
    companyId: string;
    userId?: string | null;
    activityType: ActivityType;
    description: string;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string | null;
    } | null;
}

export interface ActivityLogStats {
    byType: Array<{ type: ActivityType; count: number }>;
    topUsers: Array<{
        user: { id: string; firstName: string; lastName: string } | null;
        activityCount: number;
    }>;
    last24Hours: number;
}

export const activityLogsKeys = {
    all: ['activity-logs'] as const,
    list: (filters?: { activityType?: ActivityType; userId?: string; startDate?: string; endDate?: string }) =>
        [...activityLogsKeys.all, 'list', filters] as const,
    stats: () => [...activityLogsKeys.all, 'stats'] as const,
    myActivity: () => [...activityLogsKeys.all, 'my-activity'] as const,
    userActivity: (userId: string) => [...activityLogsKeys.all, 'user', userId] as const,
};

// Get all activity logs (admin only)
export function useActivityLogs(filters?: {
    activityType?: ActivityType;
    userId?: string;
    startDate?: string;
    endDate?: string;
}) {
    return useQuery({
        queryKey: activityLogsKeys.list(filters),
        queryFn: () => api.get<ActivityLog[]>('/activity-logs', filters),
    });
}

// Get activity log stats (admin only)
export function useActivityLogStats() {
    return useQuery({
        queryKey: activityLogsKeys.stats(),
        queryFn: () => api.get<ActivityLogStats>('/activity-logs/stats'),
    });
}

// Get my activity
export function useMyActivityLogs() {
    return useQuery({
        queryKey: activityLogsKeys.myActivity(),
        queryFn: () => api.get<ActivityLog[]>('/activity-logs/my-activity'),
    });
}

// Get user activity
export function useUserActivityLogs(userId: string) {
    return useQuery({
        queryKey: activityLogsKeys.userActivity(userId),
        queryFn: () => api.get<ActivityLog[]>(`/activity-logs/user/${userId}`),
        enabled: !!userId,
    });
}