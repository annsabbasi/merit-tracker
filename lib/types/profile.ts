// src/lib/types/profile.ts

export interface ProfileStats {
    totalTasksCompleted: number;
    totalTimeTrackedMinutes: number;
    totalTimeFormatted: string;
    totalPointsEarned: number;
    currentStreak: number;
    longestStreak: number;
    projectsCount: number;
    subProjectsCount: number;
    achievementsCount: number;
    leaderboardRank: number;
}

export interface ActivitySummary {
    date: string;
    minutesTracked: number;
    tasksCompleted: number;
    pointsEarned: number;
}

export interface Achievement {
    id: string;
    type: string;
    title: string;
    description: string;
    iconUrl?: string;
    earnedAt: string;
    metadata?: Record<string, unknown>;
}

export interface AchievementsResponse {
    total: number;
    achievements: Achievement[];
}

export interface TimeTrackingSession {
    id: string;
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    durationFormatted: string;
    notes?: string;
    isActive: boolean;
    subProject: {
        id: string;
        title: string;
    };
    project: {
        id: string;
        name: string;
    };
    screenshotsCount: number;
}

export interface ProfileNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: ProfileNotification[];
    unreadCount: number;
    total: number;
}

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    startDate?: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}

export interface UploadAvatarResponse {
    success: boolean;
    message: string;
    avatar: string;
    user: UserProfile;
}

export interface DeleteAvatarResponse {
    success: boolean;
    message: string;
}

export interface MarkNotificationsReadResponse {
    success: boolean;
    markedCount: number;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    phone?: string;
    isActive: boolean;
    points: number;
    totalTasksCompleted: number;
    totalTimeTrackedMinutes: number;
    totalPointsEarned: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: string;
    startDate?: string;
    createdAt: string;
    updatedAt: string;
    fullName: string;
    projectsCount: number;
    subProjectsCount: number;
    achievementsCount: number;
    department?: {
        id: string;
        name: string;
        tag?: string;
        lead?: {
            id: string;
            firstName: string;
            lastName: string;
            avatar?: string;
        };
    };
    company: {
        id: string;
        name: string;
        logo?: string;
        companyCode: string;
        subscriptionStatus?: string;
        screenCaptureEnabled?: boolean;
    };
    projectMemberships?: Array<{
        id: string;
        role: string;
        project: {
            id: string;
            name: string;
            status: string;
        };
    }>;
    subProjectMemberships?: Array<{
        id: string;
        subProject: {
            id: string;
            title: string;
            status: string;
        };
    }>;
    achievements?: Achievement[];
}

export interface ProfileProject {
    id: string;
    name: string;
    description?: string;
    status: string;
    projectLead?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    _count?: {
        members: number;
        subProjects: number;
    };
}