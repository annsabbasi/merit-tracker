// src/lib/hooks/use-departments.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type { Department, Project, User } from '@/lib/types/index';

// Extended Department type with stats
export interface DepartmentWithStats extends Department {
    stats: {
        totalMembers: number;
        activeMembers: number;
        totalProjects: number;
        totalTasks: number;
        completedTasks: number;
        inProgressTasks?: number;
        todoTasks?: number;
        completionRate: number;
        totalTimeHours: number;
        totalPoints: number;
        avgPointsPerMember?: number;
    };
    projects?: Array<{
        id: string;
        departmentId: string;
        projectId: string;
        assignedAt: string;
        project: Project;
        assignedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
}

export const departmentsKeys = {
    all: ['departments'] as const,
    list: (filters?: { search?: string; leadId?: string }) => [...departmentsKeys.all, 'list', filters] as const,
    detail: (id: string) => [...departmentsKeys.all, 'detail', id] as const,
    stats: (id: string) => [...departmentsKeys.all, 'stats', id] as const,
    availableProjects: (id: string) => [...departmentsKeys.all, 'available-projects', id] as const,
    availableUsers: (id: string) => [...departmentsKeys.all, 'available-users', id] as const,
};

// Get all departments with stats
export function useDepartments(filters?: { search?: string; leadId?: string }) {
    return useQuery({
        queryKey: departmentsKeys.list(filters),
        queryFn: () => api.get<DepartmentWithStats[]>('/departments', filters),
    });
}

// Get department by ID with full details
export function useDepartment(id: string) {
    return useQuery({
        queryKey: departmentsKeys.detail(id),
        queryFn: () => api.get<DepartmentWithStats>(`/departments/${id}`),
        enabled: !!id,
    });
}

// Get department stats
export function useDepartmentStats(id: string) {
    return useQuery({
        queryKey: departmentsKeys.stats(id),
        queryFn: () => api.get(`/departments/${id}/stats`),
        enabled: !!id,
    });
}

// Get available projects (not linked to this department)
export function useAvailableProjects(departmentId: string) {
    return useQuery({
        queryKey: departmentsKeys.availableProjects(departmentId),
        queryFn: () => api.get<Project[]>(`/departments/${departmentId}/available-projects`),
        enabled: !!departmentId,
    });
}

// Get available users (not in this department)
export function useAvailableUsers(departmentId: string) {
    return useQuery({
        queryKey: departmentsKeys.availableUsers(departmentId),
        queryFn: () => api.get<User[]>(`/departments/${departmentId}/available-users`),
        enabled: !!departmentId,
    });
}

// Create department
export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            tag?: string;
            leadId?: string;
            startDate?: string;
            endDate?: string;
            memberIds?: string[];
            projectIds?: string[];
        }) => api.post<DepartmentWithStats>('/departments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
        },
    });
}

// Update department
export function useUpdateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: {
                name?: string;
                description?: string;
                tag?: string;
                leadId?: string;
                startDate?: string;
                endDate?: string;
            }
        }) => api.put<DepartmentWithStats>(`/departments/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
        },
    });
}

// Assign users to department
export function useAssignUsersToDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<DepartmentWithStats>(`/departments/${id}/assign-users`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.availableUsers(id) });
        },
    });
}

// Remove users from department
export function useRemoveUsersFromDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            api.patch<DepartmentWithStats>(`/departments/${id}/remove-users`, { userIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.availableUsers(id) });
        },
    });
}

// Link projects to department
export function useLinkProjectsToDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectIds }: { id: string; projectIds: string[] }) =>
            api.patch<DepartmentWithStats>(`/departments/${id}/link-projects`, { projectIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.availableProjects(id) });
        },
    });
}

// Unlink projects from department
export function useUnlinkProjectsFromDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, projectIds }: { id: string; projectIds: string[] }) =>
            api.patch<DepartmentWithStats>(`/departments/${id}/unlink-projects`, { projectIds }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.list() });
            queryClient.invalidateQueries({ queryKey: departmentsKeys.availableProjects(id) });
        },
    });
}

// Delete department
export function useDeleteDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/departments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: departmentsKeys.all });
        },
    });
}