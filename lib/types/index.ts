// src/lib/types/index.ts

// ============ ENUMS ============
export type UserRole = 'USER' | 'QC_ADMIN' | 'COMPANY';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectMemberRole = 'MEMBER' | 'QC_ADMIN' | 'LEAD';
export type SubProjectStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
export type SopType = 'VIDEO' | 'DOCUMENT' | 'PDF' | 'LINK' | 'IMAGE';
export type SopStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

// NEW: SubProject member roles
export type SubProjectMemberRole = 'MEMBER' | 'CONTRIBUTOR' | 'REVIEWER' | 'QC_HEAD';

// NEW: Task status (granular tasks within SubProjects)
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

// NEW: Priority levels
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

// NEW: Leaderboard periods
export type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ALL_TIME';

// NEW: Achievement types
export type AchievementType =
    | 'FIRST_TASK_COMPLETED'
    | 'TASKS_10_COMPLETED'
    | 'TASKS_50_COMPLETED'
    | 'TASKS_100_COMPLETED'
    | 'TASKS_500_COMPLETED'
    | 'HOURS_10_TRACKED'
    | 'HOURS_50_TRACKED'
    | 'HOURS_100_TRACKED'
    | 'HOURS_500_TRACKED'
    | 'HOURS_1000_TRACKED'
    | 'STREAK_7_DAYS'
    | 'STREAK_30_DAYS'
    | 'STREAK_90_DAYS'
    | 'STREAK_365_DAYS'
    | 'TOP_PERFORMER_WEEK'
    | 'TOP_PERFORMER_MONTH'
    | 'MOST_IMPROVED'
    | 'TEAM_PLAYER'
    | 'MENTOR'
    | 'EARLY_BIRD'
    | 'NIGHT_OWL'
    | 'QUALITY_CHAMPION'
    | 'ZERO_DEFECTS'
    | 'CUSTOM';

// Updated notification types
export type NotificationType =
    | 'PROJECT_ASSIGNMENT'
    | 'TASK_ASSIGNMENT'
    | 'SOP_APPROVAL'
    | 'SOP_REJECTION'
    | 'CHAT_MESSAGE'
    | 'DEPARTMENT_ASSIGNMENT'
    | 'ROLE_CHANGE'
    | 'SYSTEM'
    | 'SCREENSHOT_DELETED'
    | 'TIME_DEDUCTED'
    | 'AGENT_OFFLINE'
    | 'AGENT_INSTALLED'
    // NEW: SubProject and Task notifications
    | 'SUBPROJECT_ASSIGNMENT'
    | 'SUBPROJECT_MEMBER_ADDED'
    | 'SUBPROJECT_QC_HEAD_ASSIGNED'
    | 'TASK_CREATED'
    | 'TASK_COMPLETED'
    | 'TASK_REASSIGNED'
    // NEW: Leaderboard and Achievement notifications
    | 'LEADERBOARD_RANK_CHANGED'
    | 'ACHIEVEMENT_EARNED'
    | 'STREAK_MILESTONE';

// ============ AUTH TYPES ============
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId: string;
    avatar?: string | null;
    points: number;
    // NEW: Performance stats
    totalTasksCompleted?: number;
    totalTimeTrackedMinutes?: number;
    currentStreak?: number;
    longestStreak?: number;
}

export interface AuthCompany {
    id: string;
    name: string;
    logo?: string | null;
    companyCode: string;
    screenCaptureEnabled?: boolean;
}

export interface SubscriptionInfo {
    status: SubscriptionStatus;
    isValid: boolean;
    daysRemaining: number;
    message: string;
    trialEndsAt?: string | null;
    subscriptionEndsAt?: string | null;
}

export interface AuthResponse {
    access_token: string;
    user: AuthUser;
    company: AuthCompany;
    subscription: SubscriptionInfo;
    companyCode?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterCompanyRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    phone?: string;
}

export interface RegisterUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyCode: string;
    phone?: string;
}

// ============ USER TYPES ============
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string | null;
    phone?: string | null;
    isActive: boolean;
    companyId: string;
    departmentId?: string | null;
    points: number;
    createdAt: string;
    updatedAt: string;
    department?: Department | null;
    // NEW: Performance tracking fields
    totalTasksCompleted?: number;
    totalTimeTrackedMinutes?: number;
    totalPointsEarned?: number;
    currentStreak?: number;
    longestStreak?: number;
    lastActiveDate?: string | null;
}

// ============ COMPANY TYPES ============
export interface Company {
    id: string;
    name: string;
    companyCode: string;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: string | null;
    subscriptionEndsAt?: string | null;
    isActive: boolean;
    screenCaptureEnabled?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CompanyStats {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalSops: number;
    totalDepartments: number;
}

// ============ DEPARTMENT TYPES ============
export interface Department {
    id: string;
    name: string;
    description?: string | null;
    tag?: string | null;
    companyId: string;
    leadId?: string | null;
    createdAt: string;
    updatedAt: string;
    lead?: User | null;
    users?: User[];
    _count?: { users: number };
}

// ============ PROJECT TYPES ============
export interface ProjectLead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    role?: UserRole;
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectMemberRole;
    pointsEarned: number;
    joinedAt: string;
    user: User;
}

export interface Project {
    id: string;
    name: string;
    description?: string | null;
    budget?: number | string | null;
    status: ProjectStatus;
    companyId: string;
    projectLeadId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    // Screen capture fields
    screenCaptureEnabled?: boolean;
    screenCaptureInterval?: number;
    screenMonitoringEnabled?: boolean; // Legacy
    createdAt: string;
    updatedAt: string;
    projectLead?: ProjectLead | null;
    members?: ProjectMember[];
    subProjects?: SubProject[];
    departments?: Array<{
        id: string;
        departmentId: string;
        projectId: string;
        assignedAt: string;
        department: {
            id: string;
            name: string;
            tag: string | null;
            description?: string | null;
        };
        assignedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
    _count?: { members: number; subProjects: number; chatRooms: number };
}

export interface ProjectStats {
    projectId: string;
    totalMembers: number;
    totalSubProjects: number;
    completedSubProjects: number;
    inProgressSubProjects: number;
    todoSubProjects: number;
    completionPercentage: number;
    totalTimeTrackedMinutes: number;
    totalTimeTrackedHours: number;
}

// ============ SUB-PROJECT TYPES (ENHANCED) ============
export interface SubProjectMember {
    id: string;
    subProjectId: string;
    userId: string;
    role: SubProjectMemberRole;
    joinedAt: string;
    // Performance tracking per member
    tasksCompleted: number;
    totalTimeMinutes: number;
    pointsEarned: number;
    user: User;
}

export interface SubProject {
    id: string;
    title: string;
    description?: string | null;
    projectId: string;
    assignedToId?: string | null; // Legacy
    createdById: string;
    qcHeadId?: string | null; // NEW: QC Head
    status: SubProjectStatus;
    priority?: Priority;
    pointsValue: number;
    estimatedHours?: number | null;
    actualHours?: number | null;
    dueDate?: string | null;
    completedAt?: string | null;
    totalTimeSpent?: number;
    createdAt: string;
    updatedAt: string;
    project?: { id: string; name: string; projectLeadId?: string; companyId?: string };
    assignedTo?: User | null; // Legacy
    createdBy?: User;
    qcHead?: User | null; // NEW
    members?: SubProjectMember[]; // NEW
    tasks?: Task[]; // NEW
    stats?: SubProjectStats; // NEW
    _count?: {
        timeTrackings: number;
        members?: number;
        tasks?: number;
    };
}

export interface SubProjectStats {
    memberCount: number;
    taskStats: {
        total: number;
        completed: number;
        inProgress: number;
        todo: number;
        blocked: number;
        completionPercentage: number;
    };
    timeStats: {
        totalMinutes: number;
        totalHours: number;
        sessionCount: number;
    };
    memberPerformance?: Array<{
        user: User;
        role: SubProjectMemberRole;
        tasksCompleted: number;
        totalTimeMinutes: number;
        pointsEarned: number;
    }>;
}

// ============ TASK TYPES (NEW - Granular tasks within SubProjects) ============
export interface Task {
    id: string;
    title: string;
    description?: string | null;
    subProjectId: string;
    assignedToId?: string | null;
    createdById: string;
    status: TaskStatus;
    priority: Priority;
    pointsValue: number;
    estimatedMinutes?: number | null;
    actualMinutes?: number | null;
    dueDate?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    subProject?: SubProject;
    assignedTo?: User | null;
    createdBy?: User;
    _count?: { timeTrackings: number };
}

// ============ LEADERBOARD TYPES (NEW) ============
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

export interface ProjectLeaderboardResponse {
    projectId: string;
    projectName: string;
    period: LeaderboardPeriod;
    startDate: string;
    endDate: string | null;
    totalMembers: number;
    leaderboard: Array<LeaderboardEntry & {
        role: ProjectMemberRole;
        projectPointsEarned: number;
    }>;
}

export interface SubProjectLeaderboardResponse {
    subProjectId: string;
    subProjectTitle: string;
    projectName: string;
    period: LeaderboardPeriod;
    startDate: string;
    endDate: string | null;
    totalMembers: number;
    leaderboard: Array<{
        rank: number;
        user: User;
        role: SubProjectMemberRole;
        memberStats: {
            tasksCompleted: number;
            totalTimeMinutes: number;
            pointsEarned: number;
        };
        periodStats: {
            tasksCompleted: number;
            totalMinutes: number;
            totalHours: number;
        };
        performanceScore: number;
    }>;
}

// ============ USER PERFORMANCE TYPES (NEW) ============
export interface UserPerformance {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        email: string;
        role: UserRole;
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

// ============ ACHIEVEMENT TYPES (NEW) ============
export interface Achievement {
    id?: string;
    userId?: string;
    companyId?: string;
    type: AchievementType;
    title: string;
    description: string;
    iconUrl?: string | null;
    earnedAt: string;
    metadata?: Record<string, any>;
}

// ============ TIME TRACKING TYPES ============
export interface TimeTracking {
    id: string;
    userId: string;
    subProjectId: string;
    startTime: string;
    endTime?: string | null;
    durationMinutes: number;
    notes?: string | null;
    screenshots: string[];
    isActive: boolean;
    screenCaptureRequired?: boolean;
    timeDeducted?: number;
    createdAt: string;
    updatedAt: string;
    user?: User;
    subProject?: SubProject & { project?: { id: string; name: string } };
}

export interface ActiveTimerResponse {
    active: boolean;
    timer: {
        id: string;
        subProjectId: string;
        subProjectTitle: string;
        projectId: string;
        projectName: string;
        startTime: string;
        elapsedMinutes: number;
        elapsedFormatted: string;
        notes?: string | null;
        screenshots: string[];
        screenCaptureRequired?: boolean;
        screenCaptureEnabled?: boolean;
    } | null;
}

export interface TimeSummary {
    totalSessions: number;
    totalMinutes: number;
    totalHours: number;
    totalFormatted: string;
}

export interface ProjectTimeSummary {
    projectId: string;
    summary: TimeSummary;
    byUser: Array<{
        user: User;
        sessions: number;
        totalMinutes: number;
        totalHours: number;
    }>;
    byTask: Array<{
        task: SubProject;
        sessions: number;
        totalMinutes: number;
        totalHours: number;
    }>;
}

// ============ CHAT TYPES ============
export interface ChatRoom {
    id: string;
    name: string;
    description?: string | null;
    projectId: string;
    createdById: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    createdBy?: User;
    members?: ChatRoomMember[];
    _count?: { members: number; messages: number };
}

export interface ChatRoomMember {
    id: string;
    chatRoomId: string;
    userId: string;
    isQcAdmin: boolean;
    joinedAt: string;
    user?: User;
}

export interface ChatMessage {
    id: string;
    chatRoomId: string;
    senderId: string;
    content: string;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    sender?: User;
}

// ============ SOP TYPES ============
export interface Sop {
    id: string;
    title: string;
    description?: string | null;
    type: SopType;
    fileUrl: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    status: SopStatus;
    companyId: string;
    createdById: string;
    approvedById?: string | null;
    approvedAt?: string | null;
    rejectionReason?: string | null;
    viewCount: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    createdBy?: User;
    approvedBy?: User | null;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any> | null;
    isRead: boolean;
    createdAt: string;
}

// ============ API RESPONSE TYPES ============
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}