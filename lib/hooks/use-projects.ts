// src/lib/hooks/use-projects.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project, ProjectMember, ProjectStats, ProjectStatus, ProjectMemberRole } from '@/lib/types/index';
import { api } from '../api';

export const projectsKeys = {
    all: ['projects'] as const,
    list: (filters?: { status?: ProjectStatus; search?: string }) => [...projectsKeys.all, 'list', filters] as const,
    myProjects: () => [...projectsKeys.all, 'my-projects'] as const,
    detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
    leaderboard: (id: string) => [...projectsKeys.all, 'leaderboard', id] as const,
    stats: (id: string) => [...projectsKeys.all, 'stats', id] as const,
};

// Get all projects
export function useProjects(filters?: { status?: ProjectStatus; search?: string }) {
    return useQuery({
        queryKey: projectsKeys.list(filters),
        queryFn: () => api.get<Project[]>('/projects', filters),
    });
}

// Get my projects
export function useMyProjects() {
    return useQuery({
        queryKey: projectsKeys.myProjects(),
        queryFn: () => api.get<Project[]>('/projects/my-projects'),
    });
}

// Get project by ID
export function useProject(id: string) {
    return useQuery({
        queryKey: projectsKeys.detail(id),
        queryFn: () => api.get<Project>(`/projects/${id}`),
        enabled: !!id,
    });
}

// Get project leaderboard
export function useProjectLeaderboard(id: string) {
    return useQuery({
        queryKey: projectsKeys.leaderboard(id),
        queryFn: () => api.get<ProjectMember[]>(`/projects/${id}/leaderboard`),
        enabled: !!id,
    });
}

// Get project stats
export function useProjectStats(id: string) {
    return useQuery({
        queryKey: projectsKeys.stats(id),
        queryFn: () => api.get<ProjectStats>(`/projects/${id}/stats`),
        enabled: !!id,
    });
}

// Create project
export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            budget?: number;
            status?: ProjectStatus;
            projectLeadId?: string;
            startDate?: string;
            endDate?: string;
            memberIds?: string[];
        }) => api.post<Project>('/projects/create', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        },
    });
}

// Update project
export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
            api.put<Project>(`/projects/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        },
    });
}

// Delete project
export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        },
    });
}

// Add members to project
export function useAddProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<Project>(`/projects/${id}/members/add`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
        },
    });
}

// Remove members from project
export function useRemoveProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<Project>(`/projects/${id}/members/remove`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
        },
    });
}

// Update member role
export function useUpdateMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectMemberRole }) =>
            api.patch<Project>(`/projects/${projectId}/members/role`, { userId, role }),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.leaderboard(projectId) });
        },
    });
}