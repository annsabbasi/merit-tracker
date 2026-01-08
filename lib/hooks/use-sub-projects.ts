// src/lib/hooks/use-sub-projects.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { projectsKeys } from './use-projects';
import type {
    SubProject,
    SubProjectStatus,
    SubProjectMemberRole,
    Priority,
    SubProjectStats,
    SubProjectLeaderboardResponse,
} from '@/lib/types/index';

export const subProjectsKeys = {
    all: ['sub-projects'] as const,
    byProject: (projectId: string, filters?: { status?: SubProjectStatus; priority?: Priority; search?: string; qcHeadId?: string; memberId?: string }) =>
        [...subProjectsKeys.all, 'project', projectId, filters] as const,
    mySubProjects: () => [...subProjectsKeys.all, 'my-sub-projects'] as const,
    detail: (id: string) => [...subProjectsKeys.all, 'detail', id] as const,
    stats: (id: string) => [...subProjectsKeys.all, 'stats', id] as const,
    leaderboard: (id: string) => [...subProjectsKeys.all, 'leaderboard', id] as const,
};

// ============================================
// GET SUBPROJECTS BY PROJECT
// ============================================
export function useSubProjectsByProject(
    projectId: string,
    filters?: {
        status?: SubProjectStatus;
        priority?: Priority;
        search?: string;
        qcHeadId?: string;
        memberId?: string;
    }
) {
    return useQuery({
        queryKey: subProjectsKeys.byProject(projectId, filters),
        queryFn: () => api.get<SubProject[]>(`/sub-projects/project/${projectId}`, filters),
        enabled: !!projectId,
    });
}

// ============================================
// GET MY SUBPROJECTS
// ============================================
export function useMySubProjects() {
    return useQuery({
        queryKey: subProjectsKeys.mySubProjects(),
        queryFn: () => api.get<SubProject[]>('/sub-projects/my-subprojects'),
    });
}

// ============================================
// GET SUBPROJECT BY ID
// ============================================
export function useSubProject(id: string) {
    return useQuery({
        queryKey: subProjectsKeys.detail(id),
        queryFn: () => api.get<SubProject>(`/sub-projects/${id}`),
        enabled: !!id,
    });
}

// ============================================
// GET SUBPROJECT STATS
// ============================================
export function useSubProjectStats(id: string) {
    return useQuery({
        queryKey: subProjectsKeys.stats(id),
        queryFn: () => api.get<SubProjectStats>(`/sub-projects/${id}/stats`),
        enabled: !!id,
    });
}

// ============================================
// GET SUBPROJECT LEADERBOARD
// ============================================
export function useSubProjectLeaderboard(id: string) {
    return useQuery({
        queryKey: subProjectsKeys.leaderboard(id),
        queryFn: () => api.get<SubProjectLeaderboardResponse>(`/sub-projects/${id}/leaderboard`),
        enabled: !!id,
    });
}

// ============================================
// CREATE SUBPROJECT - Anyone in company can create
// ============================================
export function useCreateSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            projectId: string;
            qcHeadId?: string;
            memberIds?: string[];
            priority?: Priority;
            pointsValue?: number;
            estimatedHours?: number;
            dueDate?: string;
        }) => api.post<SubProject>('/sub-projects', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
            queryClient.invalidateQueries({ queryKey: projectsKeys.stats(res.projectId) });
        },
    });
}

// ============================================
// UPDATE SUBPROJECT
// ============================================
export function useUpdateSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: Partial<{
                title: string;
                description: string;
                status: SubProjectStatus;
                priority: Priority;
                qcHeadId: string;
                pointsValue: number;
                estimatedHours: number;
                dueDate: string;
            }>
        }) => api.put<SubProject>(`/sub-projects/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
        },
    });
}

// ============================================
// ASSIGN QC HEAD
// ============================================
export function useAssignQcHead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, qcHeadId }: { id: string; qcHeadId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/qc-head`, { qcHeadId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// ADD MEMBERS - Anyone can add company members
// ============================================
export function useAddSubProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds, role }: { id: string; userIds: string[]; role?: SubProjectMemberRole }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/add`, { userIds, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.leaderboard(id) });
        },
    });
}

// ============================================
// REMOVE MEMBERS
// ============================================
export function useRemoveSubProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/remove`, { userIds }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.leaderboard(id) });
        },
    });
}

// ============================================
// UPDATE MEMBER ROLE
// ============================================
export function useUpdateSubProjectMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId, role }: { id: string; userId: string; role: SubProjectMemberRole }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/role`, { userId, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
        },
    });
}

// ============================================
// DELETE SUBPROJECT
// ============================================
export function useDeleteSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/sub-projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.all });
        },
    });
}

// ============================================
// LEGACY: Assign (for backward compatibility)
// ============================================
export function useAssignSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/assign`, { userId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
        },
    });
}

// ============================================
// LEGACY: Unassign (for backward compatibility)
// ============================================
export function useUnassignSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<SubProject>(`/sub-projects/${id}/unassign`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(res.id) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.byProject(res.projectId) });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
        },
    });
}