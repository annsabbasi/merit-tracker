// src/lib/hooks/use-tasks.ts
// NOTE: In Merit Tracker, "Tasks" in the UI = "SubProjects" in the backend
// This is because SubProjects ARE the main task units that users work on
// The new "granular Tasks" model adds smaller work items WITHIN SubProjects

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { SubProject, SubProjectStatus, Priority } from '@/lib/types/index';

export const tasksKeys = {
    all: ['tasks'] as const,
    byProject: (projectId: string) => [...tasksKeys.all, 'project', projectId] as const,
    myTasks: () => [...tasksKeys.all, 'my-tasks'] as const,
    detail: (id: string) => [...tasksKeys.all, 'detail', id] as const,
};

// ============================================
// GET SUBPROJECTS BY PROJECT (displayed as "Tasks")
// Backend: GET /sub-projects/project/:projectId
// ============================================
export function useTasksByProject(projectId: string) {
    return useQuery({
        queryKey: tasksKeys.byProject(projectId),
        queryFn: () => api.get<SubProject[]>(`/sub-projects/project/${projectId}`),
        enabled: !!projectId,
    });
}

// ============================================
// GET MY SUBPROJECTS (displayed as "My Tasks")
// Backend: GET /sub-projects/my-subprojects
// ============================================
export function useMyTasks() {
    return useQuery({
        queryKey: tasksKeys.myTasks(),
        queryFn: () => api.get<SubProject[]>('/sub-projects/my-subprojects'),
    });
}

// ============================================
// GET SINGLE SUBPROJECT
// Backend: GET /sub-projects/:id
// ============================================
export function useTask(id: string) {
    return useQuery({
        queryKey: tasksKeys.detail(id),
        queryFn: () => api.get<SubProject>(`/sub-projects/${id}`),
        enabled: !!id,
    });
}

// ============================================
// CREATE SUBPROJECT (displayed as "Create Task")
// Backend: POST /sub-projects
// ============================================
export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            projectId: string;
            assignedToId?: string; // Legacy - use qcHeadId or memberIds instead
            qcHeadId?: string;
            memberIds?: string[];
            status?: SubProjectStatus;
            priority?: Priority;
            pointsValue?: number;
            estimatedHours?: number;
            dueDate?: string;
        }) => api.post<SubProject>('/sub-projects', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// ============================================
// UPDATE SUBPROJECT
// Backend: PUT /sub-projects/:id
// ============================================
export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: Partial<{
                title: string;
                description: string;
                status: SubProjectStatus;
                priority: Priority;
                pointsValue: number;
                estimatedHours: number;
                dueDate: string;
            }>
        }) => api.put<SubProject>(`/sub-projects/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// ============================================
// ASSIGN QC HEAD (NEW)
// Backend: PATCH /sub-projects/:id/qc-head
// ============================================
export function useAssignQcHead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, qcHeadId }: { id: string; qcHeadId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/qc-head`, { qcHeadId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// ADD MEMBERS (NEW)
// Backend: PATCH /sub-projects/:id/members/add
// ============================================
export function useAddTaskMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds, role }: { id: string; userIds: string[]; role?: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/add`, { userIds, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// REMOVE MEMBERS (NEW)
// Backend: PATCH /sub-projects/:id/members/remove
// ============================================
export function useRemoveTaskMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/remove`, { userIds }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// UPDATE MEMBER ROLE (NEW)
// Backend: PATCH /sub-projects/:id/members/role
// ============================================
export function useUpdateTaskMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId, role }: { id: string; userId: string; role: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/role`, { userId, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// GET SUBPROJECT LEADERBOARD (NEW)
// Backend: GET /sub-projects/:id/leaderboard
// ============================================
export function useTaskLeaderboard(id: string) {
    return useQuery({
        queryKey: [...tasksKeys.detail(id), 'leaderboard'],
        queryFn: () => api.get(`/sub-projects/${id}/leaderboard`),
        enabled: !!id,
    });
}

// ============================================
// GET SUBPROJECT STATS (NEW)
// Backend: GET /sub-projects/:id/stats
// ============================================
export function useTaskStats(id: string) {
    return useQuery({
        queryKey: [...tasksKeys.detail(id), 'stats'],
        queryFn: () => api.get(`/sub-projects/${id}/stats`),
        enabled: !!id,
    });
}

// ============================================
// LEGACY: Assign (backward compatibility)
// Backend: PATCH /sub-projects/:id/assign
// ============================================
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

// ============================================
// LEGACY: Unassign (backward compatibility)
// Backend: PATCH /sub-projects/:id/unassign
// ============================================
export function useUnassignTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.patch<SubProject>(`/sub-projects/${id}/unassign`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.detail(res.id) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: tasksKeys.myTasks() });
        },
    });
}

// ============================================
// DELETE SUBPROJECT
// Backend: DELETE /sub-projects/:id
// ============================================
export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/sub-projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tasksKeys.all });
        },
    });
}