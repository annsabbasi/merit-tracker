// src/lib/hooks/use-leaderboard.ts
// Connects to the NEW /leaderboard endpoints from the backend

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { LeaderboardPeriod } from '@/lib/types/index';

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

// Response types matching backend
export interface LeaderboardEntry {
    rank: number;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        email: string;
    };
    metrics: {
        tasksCompleted: number;
        totalMinutes: number;
        totalHours: number;
        pointsEarned: number;
        subProjectsContributed: number;
        projectsContributed: number;
        averageTaskCompletionTime: number;
        sessionCount?: number;
    };
    performanceScore: number;
    currentStreak?: number;
    longestStreak?: number;
    trend: 'up' | 'down' | 'stable';
    previousRank?: number;
}

export interface LeaderboardResponse {
    period: LeaderboardPeriod;
    startDate: string;
    endDate: string | null;
    totalParticipants: number;
    leaderboard: LeaderboardEntry[];
}

export interface ProjectLeaderboardEntry extends LeaderboardEntry {
    role: string;
    projectPointsEarned: number;
}

export interface ProjectLeaderboardResponse {
    projectId: string;
    projectName: string;
    period: LeaderboardPeriod;
    startDate: string;
    endDate: string | null;
    totalMembers: number;
    leaderboard: ProjectLeaderboardEntry[];
}

export interface Achievement {
    id?: string;
    type: string;
    title: string;
    description: string;
    iconUrl?: string | null;
    earnedAt: string;
    metadata?: Record<string, any>;
}

export interface UserPerformance {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        email: string;
        role: string;
        totalPoints: number;
    };
    currentPeriod: {
        tasksCompleted: number;
        totalMinutes: number;
        totalHours: number;
        pointsEarned: number;
        subProjectsContributed: number;
        projectsContributed: number;
        sessionCount: number;
        averageTaskCompletionTime: number;
        performanceScore: number;
    };
    previousPeriod: {
        tasksCompleted: number;
        totalMinutes: number;
        performanceScore: number;
    };
    change: {
        tasksCompletedChange: number;
        tasksCompletedPercentage: number;
        timeChange: number;
        timeChangePercentage: number;
        scoreChange: number;
    };
    rank: {
        current: number;
        previous: number;
        change: number;
    };
    achievements: Achievement[];
    streaks: {
        current: number;
        longest: number;
    };
    allTimeStats: {
        totalTasksCompleted: number;
        totalTimeMinutes: number;
        totalTimeHours: number;
        lastActiveDate?: string | null;
    };
    recentActivity: Array<{
        date: string;
        minutesWorked: number;
    }>;
}

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