// src/lib/hooks/use-projects.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project, ProjectMember, ProjectStats, ProjectStatus, ProjectMemberRole } from '@/lib/types/index';
import { api } from '../api';
import { departmentsKeys } from './use-departments';

export const projectsKeys = {
    all: ['projects'] as const,
    list: (filters?: { status?: ProjectStatus; search?: string; departmentId?: string }) =>
        [...projectsKeys.all, 'list', filters] as const,
    myProjects: () => [...projectsKeys.all, 'my-projects'] as const,
    detail: (id: string) => [...projectsKeys.all, 'detail', id] as const,
    leaderboard: (id: string) => [...projectsKeys.all, 'leaderboard', id] as const,
    stats: (id: string) => [...projectsKeys.all, 'stats', id] as const,
};

// Extended Project type with department info
export interface ProjectWithDepartments extends Project {
    departments?: Array<{
        id: string;
        departmentId: string;
        projectId: string;
        assignedAt: string;
        department: {
            id: string;
            name: string;
            tag: string | null;
            description?: string | null;
        };
        assignedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
}

// Get all projects
export function useProjects(filters?: { status?: ProjectStatus; search?: string; departmentId?: string }) {
    return useQuery({
        queryKey: projectsKeys.list(filters),
        queryFn: () => api.get<ProjectWithDepartments[]>('/projects', filters),
    });
}

// Get my projects
export function useMyProjects() {
    return useQuery({
        queryKey: projectsKeys.myProjects(),
        queryFn: () => api.get<ProjectWithDepartments[]>('/projects/my-projects'),
    });
}

// Get project by ID
export function useProject(id: string) {
    return useQuery({
        queryKey: projectsKeys.detail(id),
        queryFn: () => api.get<ProjectWithDepartments>(`/projects/${id}`),
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

/**
 * Create project mutation
 * 
 * IMPORTANT: Only users with COMPANY role can create projects.
 * QC_ADMIN and USER roles will receive a 403 Forbidden error.
 * 
 * Required fields:
 * - name: Project name
 * - departmentId: Every project MUST belong to a department
 * 
 * Optional fields:
 * - screenCaptureEnabled: Enable screen capture for time tracking
 * - screenCaptureInterval: Interval in minutes (2-5, default: 3)
 */
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
            departmentId: string; // REQUIRED - Every project must belong to a department
            // Screen capture settings
            screenCaptureEnabled?: boolean;
            screenCaptureInterval?: number;
            // Legacy field (deprecated, use screenCaptureEnabled)
            screenMonitoringEnabled?: boolean;
        }) => api.post<ProjectWithDepartments>('/projects/create', data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
            // Also invalidate department queries since project count changed
            queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(variables.departmentId) });
        },
    });
}

// Update project
export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: Partial<Project> & {
                screenCaptureEnabled?: boolean;
                screenCaptureInterval?: number;
            }
        }) => api.put<ProjectWithDepartments>(`/projects/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        },
    });
}

// Delete project - Only COMPANY role can delete
export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.all });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
        },
    });
}

// Add members to project - COMPANY or Project Lead only
export function useAddProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<ProjectWithDepartments>(`/projects/${id}/members/add`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
        },
    });
}

// Remove members from project - COMPANY or Project Lead only
export function useRemoveProjectMembers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<ProjectWithDepartments>(`/projects/${id}/members/remove`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
        },
    });
}

// Update member role - COMPANY or Project Lead only
export function useUpdateMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: ProjectMemberRole }) =>
            api.patch<ProjectWithDepartments>(`/projects/${projectId}/members/role`, { userId, role }),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
            queryClient.invalidateQueries({ queryKey: projectsKeys.leaderboard(projectId) });
        },
    });
}