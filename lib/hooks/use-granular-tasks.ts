// src/lib/hooks/use-granular-tasks.ts
// This hook is for the actual Task model (granular tasks within SubProjects)
// NOT to be confused with use-tasks.ts which actually uses SubProjects

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { subProjectsKeys } from './use-sub-projects';
import type { TaskStatus, Priority, ReviewStatus } from '@/lib/types/index';

export const granularTasksKeys = {
    all: ['granular-tasks'] as const,
    bySubProject: (subProjectId: string, filters?: TaskQueryParams) =>
        [...granularTasksKeys.all, 'sub-project', subProjectId, filters] as const,
    myTasks: (filters?: TaskQueryParams) => [...granularTasksKeys.all, 'my-tasks', filters] as const,
    pendingReview: () => [...granularTasksKeys.all, 'pending-review'] as const,
    detail: (id: string) => [...granularTasksKeys.all, 'detail', id] as const,
};

// ============================================
// TYPES
// ============================================
export interface TaskQueryParams {
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string;
    createdById?: string;
    search?: string;
    pendingReview?: boolean;
}

export interface TaskAssignee {
    id: string;
    taskId: string;
    userId: string;
    assignedAt: string;
    assignedById?: string;
    isCompleted: boolean;
    completedAt?: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        email?: string;
    };
    assignedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface GranularTask {
    id: string;
    title: string;
    description?: string;
    subProjectId: string;
    assignedToId?: string; // Legacy
    createdById: string;
    status: TaskStatus;
    priority: Priority;
    pointsValue: number;
    estimatedMinutes?: number;
    actualMinutes?: number;
    dueDate?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Review workflow fields
    submittedForReviewAt?: string;
    submittedForReviewById?: string;
    reviewedAt?: string;
    reviewedById?: string;
    reviewStatus?: ReviewStatus;
    reviewNotes?: string;
    revisionCount: number;
    pointsDeducted: number;
    // Relations
    subProject?: {
        id: string;
        title: string;
        qcHeadId?: string;
        createdById: string;
        project?: {
            id: string;
            name: string;
            projectLeadId?: string;
            companyId?: string;
        };
    };
    assignedTo?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    submittedForReviewBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    reviewedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    assignees?: TaskAssignee[];
    _count?: {
        timeTrackings: number;
        assignees: number;
    };
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    subProjectId: string;
    assigneeIds?: string[];
    assignedToId?: string; // Legacy
    status?: TaskStatus;
    priority?: Priority;
    pointsValue?: number;
    estimatedMinutes?: number;
    dueDate?: string;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    pointsValue?: number;
    estimatedMinutes?: number;
    dueDate?: string;
}

export interface SubmitForReviewDto {
    notes?: string;
}

export interface ApproveTaskDto {
    notes?: string;
    bonusPoints?: number;
}

export interface RejectTaskDto {
    reason: string;
    pointsToDeduct?: number;
}

export interface BulkUpdateResult {
    results: Array<{
        taskId: string;
        success: boolean;
        task?: GranularTask;
        error?: string;
    }>;
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

// ============================================
// GET TASKS BY SUBPROJECT
// Backend: GET /tasks/sub-project/:subProjectId
// ============================================
export function useTasksBySubProject(subProjectId: string, filters?: TaskQueryParams) {
    return useQuery({
        queryKey: granularTasksKeys.bySubProject(subProjectId, filters),
        queryFn: () => api.get<GranularTask[]>(`/tasks/sub-project/${subProjectId}`, filters),
        enabled: !!subProjectId,
    });
}

// ============================================
// GET MY TASKS (assigned to current user)
// Backend: GET /tasks/my-tasks
// ============================================
export function useMyGranularTasks(filters?: TaskQueryParams) {
    return useQuery({
        queryKey: granularTasksKeys.myTasks(filters),
        queryFn: () => api.get<GranularTask[]>('/tasks/my-tasks', filters),
    });
}

// ============================================
// GET TASKS PENDING REVIEW (QC Dashboard)
// Backend: GET /tasks/pending-review
// ============================================
export function useTasksPendingReview() {
    return useQuery({
        queryKey: granularTasksKeys.pendingReview(),
        queryFn: () => api.get<GranularTask[]>('/tasks/pending-review'),
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

// ============================================
// GET SINGLE TASK
// Backend: GET /tasks/:id
// ============================================
export function useGranularTask(id: string) {
    return useQuery({
        queryKey: granularTasksKeys.detail(id),
        queryFn: () => api.get<GranularTask>(`/tasks/${id}`),
        enabled: !!id,
    });
}

// ============================================
// CREATE TASK
// Backend: POST /tasks
// ============================================
export function useCreateGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskDto) => api.post<GranularTask>('/tasks', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.detail(res.subProjectId)
            });
        },
    });
}

// ============================================
// UPDATE TASK
// Backend: PUT /tasks/:id
// ============================================
export function useUpdateGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
            api.put<GranularTask>(`/tasks/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
        },
    });
}

// ============================================
// DELETE TASK
// Backend: DELETE /tasks/:id
// ============================================
export function useDeleteGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/tasks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.all });
        },
    });
}

// ============================================
// ASSIGN USERS TO TASK
// Backend: PATCH /tasks/:id/assign
// ============================================
export function useAssignUsersToTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<GranularTask>(`/tasks/${id}/assign`, { userIds }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
        },
    });
}

// ============================================
// UNASSIGN USERS FROM TASK
// Backend: PATCH /tasks/:id/unassign
// ============================================
export function useUnassignUsersFromTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<GranularTask>(`/tasks/${id}/unassign`, { userIds }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
        },
    });
}

// ============================================
// SUBMIT TASK FOR REVIEW
// Backend: PATCH /tasks/:id/submit-for-review
// ============================================
export function useSubmitTaskForReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: SubmitForReviewDto }) =>
            api.patch<GranularTask>(`/tasks/${id}/submit-for-review`, data || {}),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.pendingReview() });
        },
    });
}

// ============================================
// APPROVE TASK (QC_ADMIN/COMPANY only)
// Backend: PATCH /tasks/:id/approve
// ============================================
export function useApproveTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: ApproveTaskDto }) =>
            api.patch<GranularTask>(`/tasks/${id}/approve`, data || {}),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.pendingReview() });
            // Also refresh leaderboard since points were awarded
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
    });
}

// ============================================
// REJECT TASK (QC_ADMIN/COMPANY only)
// Backend: PATCH /tasks/:id/reject
// ============================================
export function useRejectTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: RejectTaskDto }) =>
            api.patch<GranularTask>(`/tasks/${id}/reject`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.pendingReview() });
        },
    });
}

// ============================================
// BULK UPDATE STATUS
// Backend: PATCH /tasks/bulk/status
// ============================================
export function useBulkUpdateTaskStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskIds, status }: { taskIds: string[]; status: TaskStatus }) =>
            api.patch<BulkUpdateResult>('/tasks/bulk/status', { taskIds, status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.all });
        },
    });
}

// ============================================
// REMOVE USER FROM PROJECT (cascade)
// Backend: DELETE /tasks/project/:projectId/user/:userId
// ============================================
export function useRemoveUserFromProjectTasks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
            api.delete(`/tasks/project/${projectId}/user/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

// ============================================
// HELPER: Get status color
// ============================================
export function getTaskStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
        TODO: 'bg-gray-500/10 text-gray-500 border-gray-500',
        IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500',
        IN_REVIEW: 'bg-orange-500/10 text-orange-500 border-orange-500',
        NEEDS_REVISION: 'bg-red-500/10 text-red-500 border-red-500',
        COMPLETED: 'bg-green-500/10 text-green-500 border-green-500',
        BLOCKED: 'bg-purple-500/10 text-purple-500 border-purple-500',
        CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-400',
    };
    return colors[status] || colors.TODO;
}

// ============================================
// HELPER: Get priority color
// ============================================
export function getPriorityColor(priority: Priority): string {
    const colors: Record<Priority, string> = {
        LOW: 'bg-gray-500/10 text-gray-500',
        MEDIUM: 'bg-blue-500/10 text-blue-500',
        HIGH: 'bg-orange-500/10 text-orange-500',
        URGENT: 'bg-red-500/10 text-red-500',
        CRITICAL: 'bg-red-600/20 text-red-600',
    };
    return colors[priority] || colors.MEDIUM;
}

// ============================================
// HELPER: Get review status info
// ============================================
export function getReviewStatusInfo(status?: ReviewStatus): {
    label: string;
    color: string;
    icon: string;
} {
    if (!status) return { label: 'Not Reviewed', color: 'text-gray-500', icon: '⏳' };

    const info: Record<ReviewStatus, { label: string; color: string; icon: string }> = {
        PENDING: { label: 'Pending Review', color: 'text-orange-500', icon: '⏳' },
        APPROVED: { label: 'Approved', color: 'text-green-500', icon: '✅' },
        REJECTED: { label: 'Needs Revision', color: 'text-red-500', icon: '❌' },
    };
    return info[status];
}