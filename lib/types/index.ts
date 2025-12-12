// src/lib/types/index.ts

// ============== ENUMS ==============
export type UserRole = 'USER' | 'QC_ADMIN' | 'COMPANY_ADMIN';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectMemberRole = 'MEMBER' | 'QC_ADMIN' | 'LEAD';
export type SubProjectStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
export type SopType = 'VIDEO' | 'DOCUMENT' | 'PDF' | 'LINK' | 'IMAGE';
export type SopStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'PROJECT_ASSIGNMENT' | 'TASK_ASSIGNMENT' | 'SOP_APPROVAL' | 'SOP_REJECTION' | 'CHAT_MESSAGE' | 'DEPARTMENT_ASSIGNMENT' | 'ROLE_CHANGE' | 'SYSTEM';
export type ActivityType = 'USER_LOGIN' | 'USER_LOGOUT' | 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'SOP_CREATED' | 'SOP_APPROVED' | 'TIME_TRACKING_START' | 'TIME_TRACKING_END' | 'DEPARTMENT_CREATED' | 'USER_ROLE_CHANGED';

// ============== ENTITIES ==============
export interface Company {
    id: string;
    name: string;
    companyCode: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    isActive: boolean;
    companyId: string;
    departmentId?: string;
    points: number;
    createdAt: string;
    updatedAt: string;
    company?: Company;
    department?: Department;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    tag?: string;
    companyId: string;
    leadId?: string;
    createdAt: string;
    updatedAt: string;
    lead?: User;
    users?: User[];
    _count?: { users: number };
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    budget?: number;
    status: ProjectStatus;
    companyId: string;
    projectLeadId?: string;
    startDate?: string;
    endDate?: string;
    screenMonitoringEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    projectLead?: User;
    members?: ProjectMember[];
    subProjects?: SubProject[];
    _count?: { members: number; subProjects: number };
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectMemberRole;
    pointsEarned: number;
    joinedAt: string;
    user?: User;
}

export interface SubProject {
    id: string;
    title: string;
    description?: string;
    projectId: string;
    assignedToId?: string;
    createdById: string;
    status: SubProjectStatus;
    pointsValue: number;
    estimatedHours?: number;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    assignedTo?: User;
    createdBy?: User;
}

export interface TimeTracking {
    id: string;
    userId: string;
    subProjectId: string;
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    notes?: string;
    screenshots: string[];
    isActive: boolean;
    createdAt: string;
    user?: User;
    subProject?: SubProject;
    pointsEarned?: number;
}

export interface Sop {
    id: string;
    title: string;
    description?: string;
    type: SopType;
    fileUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    status: SopStatus;
    companyId: string;
    createdById: string;
    approvedById?: string;
    rejectionReason?: string;
    viewCount: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    createdBy?: User;
}

export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    createdById: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    members?: ChatRoomMember[];
    messages?: ChatMessage[];
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

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

export interface ActivityLog {
    id: string;
    companyId: string;
    userId?: string;
    activityType: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
    user?: User;
}

// ============== AUTH ==============
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId: string;
    avatar?: string;
    points: number;
}

export interface AuthCompany {
    id: string;
    name: string;
    logo?: string;
}

export interface SubscriptionInfo {
    status: SubscriptionStatus;
    isValid: boolean;
    daysRemaining: number;
    message: string;
}

export interface AuthResponse {
    access_token: string;
    user: AuthUser;
    company: AuthCompany;
    subscription: SubscriptionInfo;
}

// ============== REQUEST/RESPONSE ==============
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterCompanyRequest {
    companyName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
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
    } | null;
}

export interface CompanyStats {
    totalUsers: number;
    activeUsers: number;
    totalDepartments: number;
    totalProjects: number;
    totalSops: number;
}

export interface ProjectStats {
    totalMembers: number;
    totalSubProjects: number;
    completedSubProjects: number;
    completionPercentage: number;
    totalTimeTrackedHours: number;
}

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}


