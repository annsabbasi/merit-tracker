// src/lib/hooks/use-leaderboard.ts
// Complete Leaderboard hooks aligned with backend leaderboard.controller.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type {
    LeaderboardPeriod,
    LeaderboardResponse,
    LeaderboardEntry,
    ProjectLeaderboardResponse,
    UserPerformance,
    Achievement,
    AchievementType,
} from '@/lib/types/index';

export const leaderboardKeys = {
    all: ['leaderboard'] as const,
    company: (filters?: LeaderboardQueryParams) => [...leaderboardKeys.all, 'company', filters] as const,
    project: (projectId: string, filters?: LeaderboardQueryParams) =>
        [...leaderboardKeys.all, 'project', projectId, filters] as const,
    subProject: (subProjectId: string, filters?: LeaderboardQueryParams) =>
        [...leaderboardKeys.all, 'sub-project', subProjectId, filters] as const,
    myPerformance: (filters?: PerformanceQueryParams) => [...leaderboardKeys.all, 'my-performance', filters] as const,
    userPerformance: (userId: string, filters?: PerformanceQueryParams) =>
        [...leaderboardKeys.all, 'user-performance', userId, filters] as const,
    myAchievements: () => [...leaderboardKeys.all, 'my-achievements'] as const,
};

// ============================================
// QUERY PARAMS
// ============================================
export interface LeaderboardQueryParams {
    period?: LeaderboardPeriod;
    projectId?: string;
    departmentId?: string;
    subProjectId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}

export interface PerformanceQueryParams {
    period?: LeaderboardPeriod;
    startDate?: string;
    endDate?: string;
}

// Re-export types for convenience
export type {
    LeaderboardPeriod,
    LeaderboardResponse,
    LeaderboardEntry,
    ProjectLeaderboardResponse,
    UserPerformance,
    Achievement,
    AchievementType,
};

// ============================================
// GET COMPANY LEADERBOARD
// Backend: GET /leaderboard
// ============================================
export function useCompanyLeaderboard(filters?: LeaderboardQueryParams) {
    return useQuery({
        queryKey: leaderboardKeys.company(filters),
        queryFn: () => api.get<LeaderboardResponse>('/leaderboard', filters),
        staleTime: 60 * 1000, // 1 minute
    });
}

// ============================================
// GET PROJECT LEADERBOARD
// Backend: GET /leaderboard/project/:projectId
// ============================================
export function useProjectLeaderboard(projectId: string, filters?: LeaderboardQueryParams) {
    return useQuery({
        queryKey: leaderboardKeys.project(projectId, filters),
        queryFn: () => api.get<ProjectLeaderboardResponse>(`/leaderboard/project/${projectId}`, filters),
        enabled: !!projectId,
        staleTime: 60 * 1000,
    });
}

// ============================================
// GET SUBPROJECT LEADERBOARD
// Backend: GET /leaderboard/sub-project/:subProjectId
// ============================================
export function useSubProjectLeaderboard(subProjectId: string, filters?: LeaderboardQueryParams) {
    return useQuery({
        queryKey: leaderboardKeys.subProject(subProjectId, filters),
        queryFn: () => api.get(`/leaderboard/sub-project/${subProjectId}`, filters),
        enabled: !!subProjectId,
        staleTime: 60 * 1000,
    });
}

// ============================================
// GET MY PERFORMANCE
// Backend: GET /leaderboard/my-performance
// ============================================
export function useMyPerformance(filters?: PerformanceQueryParams) {
    return useQuery({
        queryKey: leaderboardKeys.myPerformance(filters),
        queryFn: () => api.get<UserPerformance>('/leaderboard/my-performance', filters),
        staleTime: 30 * 1000, // 30 seconds
    });
}

// ============================================
// GET USER PERFORMANCE (Admin only)
// Backend: GET /leaderboard/user/:userId
// ============================================
export function useUserPerformance(userId: string, filters?: PerformanceQueryParams) {
    return useQuery({
        queryKey: leaderboardKeys.userPerformance(userId, filters),
        queryFn: () => api.get<UserPerformance>(`/leaderboard/user/${userId}`, filters),
        enabled: !!userId,
        staleTime: 30 * 1000,
    });
}

// ============================================
// GET MY ACHIEVEMENTS (checks for new ones)
// Backend: GET /leaderboard/my-achievements
// ============================================
export function useMyAchievements() {
    return useQuery({
        queryKey: leaderboardKeys.myAchievements(),
        queryFn: () => api.get<UserPerformance>('/leaderboard/my-achievements'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================
// HELPER: Format performance score
// ============================================
export function formatPerformanceScore(score: number): string {
    return score.toFixed(1);
}

// ============================================
// HELPER: Get trend icon and color
// ============================================
export function getTrendInfo(trend: 'up' | 'down' | 'stable', change?: number): {
    icon: 'arrow-up' | 'arrow-down' | 'minus';
    color: string;
    text: string;
} {
    switch (trend) {
        case 'up':
            return {
                icon: 'arrow-up',
                color: 'text-green-500',
                text: change ? `+${change}` : 'Improved',
            };
        case 'down':
            return {
                icon: 'arrow-down',
                color: 'text-red-500',
                text: change ? `${change}` : 'Declined',
            };
        default:
            return {
                icon: 'minus',
                color: 'text-muted-foreground',
                text: 'No change',
            };
    }
}

// ============================================
// HELPER: Get rank badge color
// ============================================
export function getRankBadgeColor(rank: number): string {
    switch (rank) {
        case 1:
            return 'bg-yellow-500 text-white'; // Gold
        case 2:
            return 'bg-gray-400 text-white'; // Silver
        case 3:
            return 'bg-amber-600 text-white'; // Bronze
        default:
            return 'bg-muted text-muted-foreground';
    }
}

// ============================================
// HELPER: Get achievement icon
// ============================================
export function getAchievementIcon(type: string): string {
    const icons: Record<string, string> = {
        FIRST_TASK_COMPLETED: '🎯',
        TASKS_10_COMPLETED: '🔟',
        TASKS_50_COMPLETED: '⭐',
        TASKS_100_COMPLETED: '💯',
        TASKS_500_COMPLETED: '🏆',
        HOURS_10_TRACKED: '⏱️',
        HOURS_50_TRACKED: '⌛',
        HOURS_100_TRACKED: '🕐',
        HOURS_500_TRACKED: '📊',
        HOURS_1000_TRACKED: '👑',
        STREAK_7_DAYS: '🔥',
        STREAK_30_DAYS: '🌟',
        STREAK_90_DAYS: '💎',
        STREAK_365_DAYS: '🎖️',
        TOP_PERFORMER_WEEK: '🥇',
        TOP_PERFORMER_MONTH: '🏅',
        MOST_IMPROVED: '📈',
        TEAM_PLAYER: '🤝',
        MENTOR: '🎓',
        EARLY_BIRD: '🌅',
        NIGHT_OWL: '🦉',
        QUALITY_CHAMPION: '✅',
        ZERO_DEFECTS: '💪',
        CUSTOM: '🏅',
    };
    return icons[type] || '🏅';
}

// ============================================
// HELPER: Format period label
// ============================================
export function formatPeriodLabel(period: LeaderboardPeriod): string {
    const labels: Record<LeaderboardPeriod, string> = {
        DAILY: 'Today',
        WEEKLY: 'This Week',
        MONTHLY: 'This Month',
        QUARTERLY: 'This Quarter',
        YEARLY: 'This Year',
        ALL_TIME: 'All Time',
    };
    return labels[period] || period;
}

// ============================================
// HELPER: Get period date range description
// ============================================
export function getPeriodDateRange(period: LeaderboardPeriod): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    const end = now;

    switch (period) {
        case 'DAILY':
            start = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'WEEKLY':
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            break;
        case 'MONTHLY':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'QUARTERLY':
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            break;
        case 'YEARLY':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        case 'ALL_TIME':
        default:
            start = new Date(0);
            break;
    }

    return { start, end };
}

// ============================================
// HELPER: Calculate time change percentage
// ============================================
export function calculateChangePercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// HELPER: Format hours from minutes
// ============================================
export function formatHoursFromMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

// ============================================
// HELPER: Get streak milestone message
// ============================================
export function getStreakMilestoneMessage(streak: number): string | null {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    if (milestones.includes(streak)) {
        if (streak === 7) return '🔥 1 week streak!';
        if (streak === 14) return '🔥 2 weeks streak!';
        if (streak === 30) return '🌟 1 month streak!';
        if (streak === 60) return '🌟 2 months streak!';
        if (streak === 90) return '💎 3 months streak!';
        if (streak === 180) return '💎 6 months streak!';
        if (streak === 365) return '🎖️ 1 year streak!';
    }
    return null;
}

// ============================================
// HELPER: Get performance level
// ============================================
export function getPerformanceLevel(score: number): {
    level: string;
    color: string;
    description: string;
} {
    if (score >= 90) {
        return { level: 'Elite', color: 'text-purple-500', description: 'Top performer!' };
    }
    if (score >= 75) {
        return { level: 'Expert', color: 'text-blue-500', description: 'Excellent performance' };
    }
    if (score >= 50) {
        return { level: 'Proficient', color: 'text-green-500', description: 'Good progress' };
    }
    if (score >= 25) {
        return { level: 'Developing', color: 'text-yellow-500', description: 'Keep improving' };
    }
    return { level: 'Beginner', color: 'text-gray-500', description: 'Just getting started' };
}