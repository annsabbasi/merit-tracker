// src/lib/hooks/use-tasks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { projectsKeys } from './use-projects';
import type { SubProject, SubProjectStatus } from '@/lib/types/index';

export const tasksKeys = {
    all: ['tasks'] as const,
    byProject: (projectId: string, filters?: { status?: SubProjectStatus; search?: string }) =>
        [...tasksKeys.all, 'project', projectId, filters] as const,
    myTasks: () => [...tasksKeys.all, 'my-tasks'] as const,
    detail: (id: string) => [...tasksKeys.all, 'detail', id] as const,
};

// Get tasks by project
export function useTasksByProject(projectId: string, filters?: { status?: SubProjectStatus; search?: string }) {
    return useQuery({
        queryKey: tasksKeys.byProject(projectId, filters),
        queryFn: () => api.get<SubProject[]>(`/sub-projects/project/${projectId}`, filters),
        enabled: !!projectId,
    });
}

// Get my tasks
export function useMyTasks() {
    return useQuery({
        queryKey: tasksKeys.myTasks(),
        queryFn: () => api.get<SubProject[]>('/sub-projects/my-tasks'),
    });
}

// Get task by ID
export function useTask(id: string) {
    return useQuery({
        queryKey: tasksKeys.detail(id),
        queryFn: () => api.get<SubProject>(`/sub-projects/${id}`),
        enabled: !!id,
    });
}

// Create task
export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            projectId: string;
            assignedToId?: string;
            status?: SubProjectStatus;
            pointsValue?: number;
            estimatedHours?: number;
            dueDate?: string;
        }) => api.post<SubProject>('/sub-projects', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
            queryClient.invalidateQueries({ queryKey: projectsKeys.stats(res.projectId) });
        },
    });
}

// Update task
export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SubProject> }) =>
            api.put<SubProject>(`/sub-projects/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// Assign task
export function useAssignTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/assign`, { userId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// Unassign task
export function useUnassignTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<SubProject>(`/sub-projects/${id}/unassign`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(res.id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// Delete task
export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/sub-projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.all });
        },
    });
}