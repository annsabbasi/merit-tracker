// src/lib/hooks/use-granular-tasks.ts
// Complete Task hooks for granular tasks within SubProjects
// Aligned with backend tasks.controller.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { subProjectsKeys } from './use-sub-projects';
import { leaderboardKeys } from './use-leaderboard';
import type { Task, TaskStatus, Priority, ReviewStatus, TaskAssignee } from '@/lib/types/index';

export const granularTasksKeys = {
    all: ['granular-tasks'] as const,
    bySubProject: (subProjectId: string, filters?: TaskQueryParams) =>
        [...granularTasksKeys.all, 'sub-project', subProjectId, filters] as const,
    myTasks: (filters?: TaskQueryParams) => [...granularTasksKeys.all, 'my-tasks', filters] as const,
    pendingReview: () => [...granularTasksKeys.all, 'pending-review'] as const,
    detail: (id: string) => [...granularTasksKeys.all, 'detail', id] as const,
};

// Re-export types for convenience
export type { Task as GranularTask, TaskStatus, Priority, ReviewStatus, TaskAssignee };

// ============================================
// QUERY PARAMS
// ============================================
export interface TaskQueryParams {
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string;
    createdById?: string;
    search?: string;
    pendingReview?: boolean;
}

// ============================================
// DTOs matching backend
// ============================================
export interface CreateTaskDto {
    title: string;
    description?: string;
    subProjectId: string;
    assigneeIds?: string[];
    assignedToId?: string; // Legacy - use assigneeIds
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

export interface AssignTaskDto {
    userIds: string[];
}

export interface UnassignTaskDto {
    userIds: string[];
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
        task?: Task;
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
        queryFn: () => api.get<Task[]>(`/tasks/sub-project/${subProjectId}`, filters),
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
        queryFn: () => api.get<Task[]>('/tasks/my-tasks', filters),
    });
}

// ============================================
// GET TASKS PENDING REVIEW (QC Dashboard)
// Backend: GET /tasks/pending-review
// ============================================
export function useTasksPendingReview() {
    return useQuery({
        queryKey: granularTasksKeys.pendingReview(),
        queryFn: () => api.get<Task[]>('/tasks/pending-review'),
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
        queryFn: () => api.get<Task>(`/tasks/${id}`),
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
        mutationFn: (data: CreateTaskDto) => api.post<Task>('/tasks', data),
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
            api.put<Task>(`/tasks/${id}`, data),
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
            api.patch<Task>(`/tasks/${id}/assign`, { userIds }),
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
            api.patch<Task>(`/tasks/${id}/unassign`, { userIds }),
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
            api.patch<Task>(`/tasks/${id}/submit-for-review`, data || {}),
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
            api.patch<Task>(`/tasks/${id}/approve`, data || {}),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.pendingReview() });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            // Also refresh leaderboard since points were awarded
            queryClient.invalidateQueries({ queryKey: leaderboardKeys.all });
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
            api.patch<Task>(`/tasks/${id}/reject`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: granularTasksKeys.bySubProject(res.subProjectId)
            });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.pendingReview() });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
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
// HELPER: Get status badge color (for Badge component)
// ============================================
export function getTaskStatusBadgeColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
        TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        IN_REVIEW: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        NEEDS_REVISION: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        BLOCKED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    };
    return colors[status] || colors.TODO;
}

// ============================================
// HELPER: Get priority color
// ============================================
export function getPriorityColor(priority: Priority): string {
    const colors: Record<Priority, string> = {
        LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
        HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
        URGENT: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
        CRITICAL: 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[priority] || colors.MEDIUM;
}

// ============================================
// HELPER: Get review status info
// ============================================
export function getReviewStatusInfo(status?: ReviewStatus | null): {
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

// ============================================
// HELPER: Get status label (human readable)
// ============================================
export function getTaskStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
        TODO: 'To Do',
        IN_PROGRESS: 'In Progress',
        IN_REVIEW: 'In Review',
        NEEDS_REVISION: 'Needs Revision',
        COMPLETED: 'Completed',
        BLOCKED: 'Blocked',
        CANCELLED: 'Cancelled',
    };
    return labels[status] || status;
}

// ============================================
// HELPER: Get priority label
// ============================================
export function getPriorityLabel(priority: Priority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
}

// ============================================
// HELPER: Check if task can be edited
// ============================================
export function canEditTask(task: Task, userId: string, userRole: string): boolean {
    if (userRole === 'COMPANY' || userRole === 'QC_ADMIN') return true;
    if (task.createdById === userId) return true;
    if (task.subProject?.qcHeadId === userId) return true;
    if (task.subProject?.createdById === userId) return true;
    if (task.subProject?.project?.projectLeadId === userId) return true;
    if (task.assignees?.some(a => a.userId === userId)) return true;
    return false;
}

// ============================================
// HELPER: Check if task can be submitted for review
// ============================================
export function canSubmitForReview(task: Task, userId: string): boolean {
    if (task.status !== 'IN_PROGRESS' && task.status !== 'NEEDS_REVISION') return false;
    if (task.assignees?.some(a => a.userId === userId)) return true;
    if (task.createdById === userId) return true;
    return false;
}

// ============================================
// HELPER: Check if user can review task
// ============================================
export function canReviewTask(task: Task, userId: string, userRole: string): boolean {
    if (task.status !== 'IN_REVIEW') return false;
    if (userRole === 'COMPANY') return true;
    if (userRole === 'QC_ADMIN') return true;
    if (task.subProject?.qcHeadId === userId) return true;
    return false;
}