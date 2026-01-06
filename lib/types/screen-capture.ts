// src/lib/types/screen-capture.ts

// ============== ENUMS ==============
export type CaptureStatus =
    | 'SUCCESS'
    | 'FAILED'
    | 'PERMISSION_DENIED'
    | 'IDLE_DETECTED'
    | 'SCREEN_LOCKED'
    | 'OFFLINE';

export type Platform = 'WINDOWS' | 'MAC' | 'LINUX';

export type AgentActivityType =
    | 'STARTED'
    | 'STOPPED'
    | 'HEARTBEAT'
    | 'CAPTURE_SUCCESS'
    | 'CAPTURE_FAILED'
    | 'ERROR'
    | 'UPDATED';

// ============== SCREENSHOT ==============
export interface Screenshot {
    id: string;
    timeTrackingId: string;
    userId: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    capturedAt: string;
    uploadedAt: string;
    intervalStart: string;
    intervalEnd: string;
    intervalMinutes: number;
    screenWidth?: number;
    screenHeight?: number;
    monitorIndex: number;
    checksum?: string;
    captureStatus: CaptureStatus;
    isDeleted: boolean;
    deletedAt?: string;
    deletedBy?: string;
    deletionReason?: string;
    expiresAt: string;
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}

export interface ScreenshotStats {
    totalScreenshots: number;
    successfulCaptures: number;
    failedCaptures: number;
    captureRate: number;
    totalIntervalMinutes: number;
    averageIntervalMinutes: number;
    firstCaptureAt?: string;
    lastCaptureAt?: string;
}

export interface ScreenshotSummary {
    userId: string;
    totalScreenshots: number;
    totalSessions: number;
    totalMinutesCaptured: number;
    captureRate: number;
    lastCaptureAt?: string;
}

// ============== DESKTOP AGENT ==============
export interface DesktopAgent {
    id: string;
    userId: string;
    machineId: string;
    machineName?: string;
    platform: Platform;
    agentVersion: string;
    lastHeartbeat?: string;
    lastActiveAt?: string;
    isOnline: boolean;
    isActive: boolean;
    captureQuality: number;
    captureAllMonitors: boolean;
    agentToken?: string;
    tokenExpiresAt?: string;
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
    userId: string;
    companyId: string;
    screenCaptureEnabled: boolean;
    captureQuality: number;
    captureAllMonitors: boolean;
    minIntervalSeconds: number;
    maxIntervalSeconds: number;
    activeTimeTracking: {
        id: string;
        subProjectId: string;
        subProjectTitle: string;
        projectId: string;
        projectName: string;
        screenCaptureRequired: boolean;
        startTime: string;
    } | null;
    serverTime: string;
}

export interface AgentDownloadInfo {
    windows: {
        url: string;
        filename: string;
        size: string;
    };
    mac: {
        url: string;
        filename: string;
        size: string;
    };
    linux: {
        url: string;
        filename: string;
        size: string;
    };
    currentVersion: string;
    releaseNotes?: string;
}

export interface AgentActivityLog {
    id: string;
    agentId: string;
    activityType: AgentActivityType;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

// ============== API RESPONSES ==============
export interface RegisterAgentResponse {
    agent: DesktopAgent;
    token: string;
    config: AgentConfig;
}

export interface UploadScreenshotResponse {
    screenshot: Screenshot;
    message: string;
}

export interface DeleteScreenshotResponse {
    message: string;
    minutesDeducted: number;
    newDuration: number;
    totalTimeDeducted: number;
    pointsDeducted?: number;
}

export interface BulkDeleteScreenshotsResponse {
    message: string;
    deletedCount: number;
    totalMinutesDeducted: number;
}

export interface AgentCheckResponse {
    installed: boolean;
    online: boolean;
    agent?: DesktopAgent;
}

// ============== QUERY PARAMS ==============
export interface ScreenshotQueryParams {
    timeTrackingId?: string;
    userId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    captureStatus?: CaptureStatus;
    page?: number;
    limit?: number;
}

// ============== UPDATED TIME TRACKING ==============
export interface TimeTrackingWithScreenshots {
    id: string;
    userId: string;
    subProjectId: string;
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    notes?: string;
    isActive: boolean;
    screenCaptureRequired: boolean;
    timeDeducted: number;
    createdAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    subProject?: {
        id: string;
        title: string;
        project: {
            id: string;
            name: string;
            screenCaptureEnabled: boolean;
        };
    };
    screenCaptures?: Screenshot[];
    _count?: {
        screenCaptures: number;
    };
}

export interface ActiveTimerWithScreenshots {
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
        notes?: string;
        potentialPoints: number;
        screenCaptureRequired: boolean;
        screenCaptureEnabled: boolean;
        recentScreenshots: Screenshot[];
        screenshotsCount: number;
        timeDeducted: number;
    } | null;
}

// ============== ERROR RESPONSES ==============
export interface AgentRequiredError {
    code: 'AGENT_NOT_INSTALLED' | 'AGENT_OFFLINE';
    message: string;
    downloadRequired?: boolean;
    agentOffline?: boolean;
}