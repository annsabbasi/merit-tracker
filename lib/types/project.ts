// src/lib/types/index.ts

// ============ ENUMS ============
export type UserRole = 'USER' | 'QC_ADMIN' | 'COMPANY';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectMemberRole = 'MEMBER' | 'QC_ADMIN' | 'LEAD';
export type SubProjectStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
export type SopType = 'VIDEO' | 'DOCUMENT' | 'PDF' | 'LINK' | 'IMAGE';
export type SopStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'PROJECT_ASSIGNMENT' | 'TASK_ASSIGNMENT' | 'SOP_APPROVAL' | 'SOP_REJECTION' | 'CHAT_MESSAGE' | 'DEPARTMENT_ASSIGNMENT' | 'ROLE_CHANGE' | 'SYSTEM';

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
}

export interface AuthCompany {
    id: string;
    name: string;
    logo?: string | null;
    companyCode: string;
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
    screenMonitoringEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    projectLead?: ProjectLead | null;
    members?: ProjectMember[];
    subProjects?: SubProject[];
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

// ============ SUB-PROJECT (TASK) TYPES ============
export interface SubProject {
    id: string;
    title: string;
    description?: string | null;
    projectId: string;
    assignedToId?: string | null;
    createdById: string;
    status: SubProjectStatus;
    pointsValue: number;
    estimatedHours?: number | null;
    dueDate?: string | null;
    createdAt: string;
    updatedAt: string;
    project?: { id: string; name: string };
    assignedTo?: User | null;
    createdBy?: User;
    _count?: { timeTrackings: number };
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