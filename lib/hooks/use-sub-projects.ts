// src/lib/hooks/use-sub-projects.ts
// Complete SubProject hooks aligned with backend sub-projects.controller.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import { projectsKeys } from './use-projects';
import type {
    SubProject,
    SubProjectStatus,
    SubProjectMemberRole,
    SubProjectStats,
    SubProjectLeaderboardEntry,
    Priority,
} from '@/lib/types/index';

export const subProjectsKeys = {
    all: ['sub-projects'] as const,
    byProject: (projectId: string, filters?: SubProjectQueryParams) =>
        [...subProjectsKeys.all, 'project', projectId, filters] as const,
    mySubProjects: () => [...subProjectsKeys.all, 'my-sub-projects'] as const,
    detail: (id: string) => [...subProjectsKeys.all, 'detail', id] as const,
    stats: (id: string) => [...subProjectsKeys.all, 'stats', id] as const,
    leaderboard: (id: string) => [...subProjectsKeys.all, 'leaderboard', id] as const,
};

// ============================================
// QUERY PARAMS
// ============================================
export interface SubProjectQueryParams {
    status?: SubProjectStatus;
    priority?: Priority;
    search?: string;
    qcHeadId?: string;
    memberId?: string;
}

// ============================================
// DTOs matching backend
// ============================================
export interface CreateSubProjectDto {
    title: string;
    description?: string;
    projectId: string;
    qcHeadId?: string;
    memberIds?: string[];
    assignedToId?: string; // Legacy - use memberIds instead
    status?: SubProjectStatus;
    priority?: Priority;
    pointsValue?: number;
    estimatedHours?: number;
    dueDate?: string;
}

export interface UpdateSubProjectDto {
    title?: string;
    description?: string;
    status?: SubProjectStatus;
    priority?: Priority;
    qcHeadId?: string;
    pointsValue?: number;
    estimatedHours?: number;
    dueDate?: string;
}

export interface AssignQcHeadDto {
    qcHeadId: string;
}

export interface AddSubProjectMembersDto {
    userIds: string[];
    role?: SubProjectMemberRole;
}

export interface RemoveSubProjectMembersDto {
    userIds: string[];
}

export interface UpdateSubProjectMemberRoleDto {
    userId: string;
    role: SubProjectMemberRole;
}

// ============================================
// GET SUBPROJECTS BY PROJECT
// Backend: GET /sub-projects/project/:projectId
// ============================================
export function useSubProjectsByProject(projectId: string, filters?: SubProjectQueryParams) {
    return useQuery({
        queryKey: subProjectsKeys.byProject(projectId, filters),
        queryFn: () => api.get<SubProject[]>(`/sub-projects/project/${projectId}`, filters),
        enabled: !!projectId,
    });
}

// ============================================
// GET MY SUBPROJECTS
// Backend: GET /sub-projects/my-subprojects
// ============================================
export function useMySubProjects() {
    return useQuery({
        queryKey: subProjectsKeys.mySubProjects(),
        queryFn: () => api.get<SubProject[]>('/sub-projects/my-subprojects'),
    });
}

// ============================================
// GET SUBPROJECT BY ID (with stats)
// Backend: GET /sub-projects/:id
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
// Backend: GET /sub-projects/:id/stats
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
// Backend: GET /sub-projects/:id/leaderboard
// ============================================
export function useSubProjectLeaderboard(id: string) {
    return useQuery({
        queryKey: subProjectsKeys.leaderboard(id),
        queryFn: () => api.get<SubProjectLeaderboardEntry[]>(`/sub-projects/${id}/leaderboard`),
        enabled: !!id,
    });
}

// ============================================
// CREATE SUBPROJECT
// Backend: POST /sub-projects
// Anyone in company can create subprojects
// ============================================
export function useCreateSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubProjectDto) =>
            api.post<SubProject>('/sub-projects', data),
        onSuccess: (res) => {
            // Invalidate the project's subprojects list
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            // Invalidate my subprojects
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.mySubProjects()
            });
            // Invalidate project stats since subproject count changed
            queryClient.invalidateQueries({
                queryKey: projectsKeys.stats(res.projectId)
            });
            // Invalidate project detail
            queryClient.invalidateQueries({
                queryKey: projectsKeys.detail(res.projectId)
            });
        },
    });
}

// ============================================
// UPDATE SUBPROJECT
// Backend: PUT /sub-projects/:id
// ============================================
export function useUpdateSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateSubProjectDto }) =>
            api.put<SubProject>(`/sub-projects/${id}`, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
            // Invalidate project stats if status changed
            queryClient.invalidateQueries({
                queryKey: projectsKeys.stats(res.projectId)
            });
        },
    });
}

// ============================================
// DELETE SUBPROJECT
// Backend: DELETE /sub-projects/:id
// ============================================
export function useDeleteSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/sub-projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.all });
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        },
    });
}

// ============================================
// ASSIGN QC HEAD
// Backend: PATCH /sub-projects/:id/qc-head
// ============================================
export function useAssignQcHead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, qcHeadId }: { id: string; qcHeadId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/qc-head`, { qcHeadId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
        },
    });
}

// ============================================
// ADD MEMBERS
// Backend: PATCH /sub-projects/:id/members/add
// Anyone can add company members
// ============================================
export function useAddSubProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds, role }: {
            id: string;
            userIds: string[];
            role?: SubProjectMemberRole;
        }) => api.patch<SubProject>(`/sub-projects/${id}/members/add`, { userIds, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.leaderboard(id) });
        },
    });
}

// ============================================
// REMOVE MEMBERS
// Backend: PATCH /sub-projects/:id/members/remove
// ============================================
export function useRemoveSubProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<SubProject>(`/sub-projects/${id}/members/remove`, { userIds }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.leaderboard(id) });
        },
    });
}

// ============================================
// UPDATE MEMBER ROLE
// Backend: PATCH /sub-projects/:id/members/role
// ============================================
export function useUpdateSubProjectMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId, role }: {
            id: string;
            userId: string;
            role: SubProjectMemberRole;
        }) => api.patch<SubProject>(`/sub-projects/${id}/members/role`, { userId, role }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
        },
    });
}

// ============================================
// LEGACY: Assign (for backward compatibility)
// Backend: PATCH /sub-projects/:id/assign
// ============================================
export function useAssignSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            api.patch<SubProject>(`/sub-projects/${id}/assign`, { userId }),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
        },
    });
}

// ============================================
// LEGACY: Unassign (for backward compatibility)
// Backend: PATCH /sub-projects/:id/unassign
// ============================================
export function useUnassignSubProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch<SubProject>(`/sub-projects/${id}/unassign`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.detail(res.id) });
            queryClient.invalidateQueries({
                queryKey: subProjectsKeys.byProject(res.projectId)
            });
            queryClient.invalidateQueries({ queryKey: subProjectsKeys.mySubProjects() });
        },
    });
}

// ============================================
// HELPER: Get status color
// ============================================
export function getSubProjectStatusColor(status: SubProjectStatus): string {
    const colors: Record<SubProjectStatus, string> = {
        TODO: 'bg-gray-500/10 text-gray-500 border-gray-500',
        IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500',
        IN_REVIEW: 'bg-orange-500/10 text-orange-500 border-orange-500',
        COMPLETED: 'bg-green-500/10 text-green-500 border-green-500',
    };
    return colors[status] || colors.TODO;
}

// ============================================
// HELPER: Get priority color
// ============================================
export function getSubProjectPriorityColor(priority: Priority): string {
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
// HELPER: Get member role color
// ============================================
export function getMemberRoleColor(role: SubProjectMemberRole): string {
    const colors: Record<SubProjectMemberRole, string> = {
        QC_HEAD: 'bg-purple-500/10 text-purple-500 border-purple-500',
        REVIEWER: 'bg-blue-500/10 text-blue-500 border-blue-500',
        CONTRIBUTOR: 'bg-green-500/10 text-green-500 border-green-500',
        MEMBER: 'bg-gray-500/10 text-gray-500 border-gray-500',
    };
    return colors[role] || colors.MEMBER;
}

// ============================================
// HELPER: Get member role label
// ============================================
export function getMemberRoleLabel(role: SubProjectMemberRole): string {
    const labels: Record<SubProjectMemberRole, string> = {
        QC_HEAD: 'QC Head',
        REVIEWER: 'Reviewer',
        CONTRIBUTOR: 'Contributor',
        MEMBER: 'Member',
    };
    return labels[role] || role;
}