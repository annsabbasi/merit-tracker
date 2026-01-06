// src/lib/hooks/use-screenshots.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { timeTrackingKeys } from './use-time-tracking';
import { usersKeys } from './use-users';
import type {
    Screenshot,
    ScreenshotStats,
    ScreenshotSummary,
    ScreenshotQueryParams,
    DeleteScreenshotResponse,
    BulkDeleteScreenshotsResponse,
} from '@/lib/types/screen-capture';

export const screenshotsKeys = {
    all: ['screenshots'] as const,
    list: (filters?: ScreenshotQueryParams) => [...screenshotsKeys.all, 'list', filters] as const,
    byTimeTracking: (timeTrackingId: string) => [...screenshotsKeys.all, 'time-tracking', timeTrackingId] as const,
    stats: (timeTrackingId: string) => [...screenshotsKeys.all, 'stats', timeTrackingId] as const,
    detail: (id: string) => [...screenshotsKeys.all, 'detail', id] as const,
    mySummary: () => [...screenshotsKeys.all, 'my-summary'] as const,
    userSummary: (userId: string) => [...screenshotsKeys.all, 'user-summary', userId] as const,
};

// ============================================
// GET SCREENSHOTS WITH FILTERS
// ============================================
export function useScreenshots(filters?: ScreenshotQueryParams) {
    return useQuery({
        queryKey: screenshotsKeys.list(filters),
        queryFn: () => api.get<Screenshot[]>('/screenshots', filters),
        enabled: Object.keys(filters || {}).length > 0,
    });
}

// ============================================
// GET SCREENSHOTS BY TIME TRACKING SESSION
// ============================================
export function useScreenshotsByTimeTracking(timeTrackingId: string) {
    return useQuery({
        queryKey: screenshotsKeys.byTimeTracking(timeTrackingId),
        queryFn: () => api.get<Screenshot[]>(`/screenshots/time-tracking/${timeTrackingId}`),
        enabled: !!timeTrackingId,
    });
}

// ============================================
// GET SCREENSHOT STATS FOR A SESSION
// ============================================
export function useScreenshotStats(timeTrackingId: string) {
    return useQuery({
        queryKey: screenshotsKeys.stats(timeTrackingId),
        queryFn: () => api.get<ScreenshotStats>(`/screenshots/time-tracking/${timeTrackingId}/stats`),
        enabled: !!timeTrackingId,
    });
}

// ============================================
// GET SINGLE SCREENSHOT
// ============================================
export function useScreenshot(id: string) {
    return useQuery({
        queryKey: screenshotsKeys.detail(id),
        queryFn: () => api.get<Screenshot>(`/screenshots/${id}`),
        enabled: !!id,
    });
}

// ============================================
// GET MY SCREENSHOT SUMMARY
// ============================================
export function useMyScreenshotSummary() {
    return useQuery({
        queryKey: screenshotsKeys.mySummary(),
        queryFn: () => api.get<ScreenshotSummary>('/screenshots/my-summary'),
    });
}

// ============================================
// GET USER SCREENSHOT SUMMARY (ADMIN)
// ============================================
export function useUserScreenshotSummary(userId: string) {
    return useQuery({
        queryKey: screenshotsKeys.userSummary(userId),
        queryFn: () => api.get<ScreenshotSummary>(`/screenshots/user/${userId}/summary`),
        enabled: !!userId,
    });
}

// ============================================
// DELETE SCREENSHOT (with time deduction)
// ============================================
export function useDeleteScreenshot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            api.delete<DeleteScreenshotResponse>(`/screenshots/${id}`, { data: { reason } }),
        onSuccess: (data, { id }) => {
            // Invalidate all screenshot-related queries
            queryClient.invalidateQueries({ queryKey: screenshotsKeys.all });
            // Invalidate time tracking queries as duration may have changed
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.all });
            // Invalidate user queries as points may have changed
            queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
        },
    });
}

// ============================================
// BULK DELETE SCREENSHOTS
// ============================================
export function useBulkDeleteScreenshots() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) =>
            api.delete<BulkDeleteScreenshotsResponse>('/screenshots/bulk', {
                data: { screenshotIds: ids, reason }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: screenshotsKeys.all });
            queryClient.invalidateQueries({ queryKey: timeTrackingKeys.all });
            queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
        },
    });
}