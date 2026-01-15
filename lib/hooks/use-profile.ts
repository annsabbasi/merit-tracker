// src/lib/hooks/use-profile.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api/request';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
    UserProfile,
    ProfileStats,
    ActivitySummary,
    AchievementsResponse,
    TimeTrackingSession,
    NotificationsResponse,
    ProfileProject,
    UpdateProfileDto,
    ChangePasswordDto,
    ChangePasswordResponse,
    UploadAvatarResponse,
    DeleteAvatarResponse,
    MarkNotificationsReadResponse,
} from '@/lib/types/profile';

// ============================================
// QUERY KEYS
// ============================================
export const profileKeys = {
    all: ['profile'] as const,
    detail: () => [...profileKeys.all, 'detail'] as const,
    stats: () => [...profileKeys.all, 'stats'] as const,
    activity: (days?: number) => [...profileKeys.all, 'activity', days] as const,
    achievements: () => [...profileKeys.all, 'achievements'] as const,
    projects: () => [...profileKeys.all, 'projects'] as const,
    timeTrackings: (limit?: number) => [...profileKeys.all, 'time-trackings', limit] as const,
    notifications: (unreadOnly?: boolean, limit?: number) =>
        [...profileKeys.all, 'notifications', { unreadOnly, limit }] as const,
};

// ============================================
// GET PROFILE
// ============================================
export function useProfile() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.detail(),
        queryFn: () => api.get<UserProfile>('/profile'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================
// UPDATE PROFILE
// ============================================
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const setUser: any = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: (data: UpdateProfileDto) =>
            api.put<UserProfile>('/profile', data),
        onSuccess: (updatedProfile) => {
            // Update cache
            queryClient.setQueryData(profileKeys.detail(), updatedProfile);
            queryClient.invalidateQueries({ queryKey: profileKeys.all });

            // Update auth store with new user data
            setUser({
                id: updatedProfile.id,
                email: updatedProfile.email,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                role: updatedProfile.role as any,
                avatar: updatedProfile.avatar,
                points: updatedProfile.points,
            });

            toast.success('Profile updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update profile');
        },
    });
}

// ============================================
// CHANGE PASSWORD
// ============================================
export function useChangePassword() {
    return useMutation({
        mutationFn: (data: ChangePasswordDto) =>
            api.post<ChangePasswordResponse>('/profile/change-password', data),
        onSuccess: () => {
            toast.success('Password changed successfully!');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to change password';
            toast.error(message);
        },
    });
}

// ============================================
// UPLOAD AVATAR
// ============================================
export function useUploadAvatar() {
    const queryClient = useQueryClient();
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload avatar');
            }

            return response.json() as Promise<UploadAvatarResponse>;
        },
        onSuccess: (data) => {
            // Update cache
            queryClient.invalidateQueries({ queryKey: profileKeys.detail() });

            // Update auth store
            if (user) {
                setUser({
                    ...user,
                    avatar: data.avatar,
                });
            }

            toast.success('Avatar uploaded successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to upload avatar');
        },
    });
}

// ============================================
// DELETE AVATAR
// ============================================
export function useDeleteAvatar() {
    const queryClient = useQueryClient();
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);

    return useMutation({
        mutationFn: () => api.delete<DeleteAvatarResponse>('/profile/avatar'),
        onSuccess: () => {
            // Update cache
            queryClient.invalidateQueries({ queryKey: profileKeys.detail() });

            // Update auth store
            if (user) {
                setUser({
                    ...user,
                    avatar: undefined,
                });
            }

            toast.success('Avatar deleted successfully!');
        },
        onError: () => {
            toast.error('Failed to delete avatar');
        },
    });
}

// ============================================
// GET PROFILE STATS
// ============================================
export function useProfileStats() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.stats(),
        queryFn: () => api.get<ProfileStats>('/profile/stats'),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// ============================================
// GET ACTIVITY SUMMARY
// ============================================
export function useActivitySummary(days: number = 30) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.activity(days),
        queryFn: () => api.get<ActivitySummary[]>(`/profile/activity?days=${days}`),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================
// GET ACHIEVEMENTS
// ============================================
export function useAchievements() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.achievements(),
        queryFn: () => api.get<AchievementsResponse>('/profile/achievements'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================
// GET MY PROJECTS
// ============================================
export function useMyProjects() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.projects(),
        queryFn: () => api.get<ProfileProject[]>('/profile/projects'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// ============================================
// GET RECENT TIME TRACKINGS
// ============================================
export function useRecentTimeTrackings(limit: number = 10) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.timeTrackings(limit),
        queryFn: () => api.get<TimeTrackingSession[]>(`/profile/time-trackings?limit=${limit}`),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

// ============================================
// GET NOTIFICATIONS
// ============================================
export function useProfileNotifications(unreadOnly: boolean = false, limit: number = 20) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: profileKeys.notifications(unreadOnly, limit),
        queryFn: () =>
            api.get<NotificationsResponse>(`/profile/notifications?unreadOnly=${unreadOnly}&limit=${limit}`),
        enabled: isAuthenticated,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}

// ============================================
// MARK NOTIFICATIONS AS READ
// ============================================
export function useMarkNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationIds?: string[]) =>
            api.patch<MarkNotificationsReadResponse>('/profile/notifications/read', { notificationIds }),
        onSuccess: () => {
            // Invalidate all notification queries
            queryClient.invalidateQueries({
                queryKey: profileKeys.notifications()
            });
            toast.success('Notifications marked as read');
        },
        onError: () => {
            toast.error('Failed to mark notifications as read');
        },
    });
}