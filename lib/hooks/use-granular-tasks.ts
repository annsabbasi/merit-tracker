// src/lib/hooks/use-granular-tasks.ts
// This hook handles the NEW granular Task model (tasks within SubProjects)
// Different from use-tasks.ts which handles SubProjects as tasks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { subProjectsKeys } from './use-sub-projects';
import { usersKeys } from './use-users';
import type { Task, TaskStatus, Priority } from '@/lib/types/index';

export const granularTasksKeys = {
    all: ['granular-tasks'] as const,
    bySubProject: (subProjectId: string, filters?: { status?: TaskStatus; priority?: Priority; search?: string; assignedToId?: string }) =>
        [...granularTasksKeys.all, 'sub-project', subProjectId, filters] as const,
    myTasks: (filters?: { status?: TaskStatus; priority?: Priority }) =>
        [...granularTasksKeys.all, 'my-tasks', filters] as const,
    detail: (id: string) => [...granularTasksKeys.all, 'detail', id] as const,
};

// ============================================
// GET TASKS BY SUBPROJECT
// ============================================
export function useTasksBySubProject(
    subProjectId: string,
    filters?: {
        status?: TaskStatus;
        priority?: Priority;
        search?: string;
        assignedToId?: string;
        createdById?: string;
    }
) {
    return useQuery({
        queryKey: granularTasksKeys.bySubProject(subProjectId, filters),
        queryFn: () => api.get<Task[]>(`/tasks/sub-project/${subProjectId}`, filters),
        enabled: !!subProjectId,
    });
}

// ============================================
// GET MY TASKS
// ============================================
export function useMyGranularTasks(filters?: { status?: TaskStatus; priority?: Priority }) {
    return useQuery({
        queryKey: granularTasksKeys.myTasks(filters),
        queryFn: () => api.get<Task[]>('/tasks/my-tasks', filters),
    });
}

// ============================================
// GET TASK BY ID
// ============================================
export function useGranularTask(id: string) {
    return useQuery({
        queryKey: granularTasksKeys.detail(id),
        queryFn: () => api.get<Task>(`/tasks/${id}`),
        enabled: !!id,
    });
}

// ============================================
// CREATE TASK - Anyone can create and assign
// ============================================
export function useCreateGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            subProjectId: string;
            assignedToId?: string;
            priority?: Priority;
            pointsValue?: number;
            estimatedMinutes?: number;
            dueDate?: string;
        }) => api.post<Task>('/tasks', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.bySubProject(res.subProjectId) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(res.subProjectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.stats(res.subProjectId) });
        },
    });
}

// ============================================
// UPDATE TASK
// ============================================
export function useUpdateGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: Partial<{
                title: string;
                description: string;
                status: TaskStatus;
                priority: Priority;
                pointsValue: number;
                estimatedMinutes: number;
                dueDate: string;
            }>
        }) => api.put<Task>(`/tasks/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.bySubProject(res.subProjectId) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.stats(res.subProjectId) });
            // If task completed, refresh leaderboard
            if (res.status === 'COMPLETED') {
                queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
            }
        },
    });
}

// ============================================
// ASSIGN TASK
// ============================================
export function useAssignGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            api.patch<Task>(`/tasks/${id}/assign`, { userId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.bySubProject(res.subProjectId) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
            // Task assignment may add user to subproject
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(res.subProjectId) });
        },
    });
}

// ============================================
// UNASSIGN TASK
// ============================================
export function useUnassignGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<Task>(`/tasks/${id}/unassign`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.detail(res.id) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.bySubProject(res.subProjectId) });
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.myTasks() });
        },
    });
}

// ============================================
// BULK UPDATE STATUS
// ============================================
export function useBulkUpdateTaskStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskIds, status }: { taskIds: string[]; status: TaskStatus }) =>
            api.patch<{
                results: Array<{ taskId: string; success: boolean; task?: Task; error?: string }>;
                summary: { total: number; successful: number; failed: number };
            }>('/tasks/bulk/status', { taskIds, status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.all });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.all });
            queryClient.invalidateQueries({ queryKey: usersKeys.leaderboard() });
        },
    });
}

// ============================================
// DELETE TASK
// ============================================
export function useDeleteGranularTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/tasks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: granularTasksKeys.all });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.all });
        },
    });
}