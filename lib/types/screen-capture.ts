// src/lib/types/screen-capture.ts

// ============================================
// PLATFORM & STATUS TYPES
// ============================================
export type Platform = 'WINDOWS' | 'MAC' | 'LINUX';

export type CaptureStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

// ============================================
// DESKTOP AGENT TYPES
// ============================================
export interface DesktopAgent {
    id: string;
    userId: string;
    companyId: string;
    machineId: string;
    machineName?: string;
    platform: Platform;
    agentVersion: string;
    isActive: boolean;
    isOnline: boolean;
    lastHeartbeat?: string;
    captureQuality: number;
    captureAllMonitors: boolean;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

export interface AgentConfig {
    captureInterval: number;
    captureQuality: number;
    captureAllMonitors: boolean;
    uploadRetryAttempts: number;
    heartbeatInterval: number;
}

export interface AgentDownloadInfo {
    version: string;
    windows?: string;
    mac?: string;
    linux?: string;
    releaseNotes?: string;
    minimumVersion?: string;
}

export interface RegisterAgentResponse {
    agent: DesktopAgent;
    token: string;
    config: AgentConfig;
}

export interface AgentCheckResponse {
    installed: boolean;
    online: boolean;
    agents?: DesktopAgent[];
}

// ============================================
// SCREENSHOT TYPES
// ============================================
export interface Screenshot {
    id: string;
    timeTrackingId: string;
    userId: string;
    companyId: string;
    filePath: string;
    fileUrl: string;
    capturedAt: string;
    intervalMinutes: number;
    screenWidth?: number;
    screenHeight?: number;
    monitorIndex?: number;
    captureStatus: CaptureStatus;
    failureReason?: string;
    checksum?: string;
    isDeleted: boolean;
    deletedAt?: string;
    deletedBy?: string;
    deletionReason?: string;
    createdAt: string;
    updatedAt: string;
    timeTracking?: {
        id: string;
        subProjectId: string;
        subProject?: {
            id: string;
            title: string;
            projectId: string;
            project?: {
                id: string;
                name: string;
            };
        };
    };
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

export interface ScreenshotStats {
    totalScreenshots: number;
    successCount: number;
    failedCount: number;
    averageInterval: number;
    totalSizeBytes?: number;
}

export interface ScreenshotSummary {
    total: number;
    byStatus?: Array<{
        status: CaptureStatus;
        _count: number;
    }>;
    deleted?: {
        count: number;
        totalMinutesDeducted: number;
    };
}

export interface ScreenshotQueryParams {
    userId?: string;
    projectId?: string;
    subProjectId?: string;
    timeTrackingId?: string;
    startDate?: string;
    endDate?: string;
    status?: CaptureStatus;
    limit?: number;
    offset?: number;
}

export interface DeleteScreenshotResponse {
    success: boolean;
    screenshot: Screenshot;
    minutesDeducted: number;
    newDuration: number;
}

export interface BulkDeleteScreenshotsResponse {
    success: boolean;
    deletedCount: number;
    totalMinutesDeducted: number;
    affectedSessions: number;
}

// ============================================
// TIME TRACKING WITH SCREENSHOTS
// ============================================
export interface ActiveTimerWithScreenshots {
    active: boolean;
    timer?: {
        id: string;
        userId: string;
        subProjectId: string;
        subProjectTitle: string;
        projectId: string;
        projectName: string;
        startTime: string;
        notes?: string;
        screenCaptureRequired: boolean;
        screenshots?: Screenshot[];
    };
}

// ============================================
// UPLOAD TYPES (for Desktop Agent)
// ============================================
export interface UploadScreenshotDto {
    timeTrackingId: string;
    capturedAt: string;
    screenWidth?: number;
    screenHeight?: number;
    monitorIndex?: number;
    checksum?: string;
}

export interface UploadScreenshotResponse {
    id: string;
    fileUrl: string;
    filePath: string;
    capturedAt: string;
    intervalMinutes: number;
}

export interface ReportFailedCaptureDto {
    timeTrackingId: string;
    capturedAt: string;
    failureReason: string;
}