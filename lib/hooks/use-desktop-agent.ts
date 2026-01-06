// src/lib/hooks/use-desktop-agent.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/request';
import type {
    DesktopAgent,
    AgentConfig,
    AgentDownloadInfo,
    RegisterAgentResponse,
    AgentCheckResponse,
    Platform,
} from '@/lib/types/screen-capture';

export const desktopAgentKeys = {
    all: ['desktop-agent'] as const,
    myAgents: () => [...desktopAgentKeys.all, 'my-agents'] as const,
    checkInstalled: () => [...desktopAgentKeys.all, 'check-installed'] as const,
    downloadInfo: () => [...desktopAgentKeys.all, 'download-info'] as const,
    detail: (id: string) => [...desktopAgentKeys.all, 'detail', id] as const,
    companyAgents: () => [...desktopAgentKeys.all, 'company-agents'] as const,
};

// ============================================
// REGISTER AGENT (Used by desktop app OR simulate)
// ============================================
export interface RegisterAgentDto {
    machineId: string;
    machineName?: string;
    platform: Platform;
    agentVersion: string;
}

export function useRegisterAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterAgentDto) =>
            api.post<RegisterAgentResponse>('/desktop-agent/register', data),
        onSuccess: () => {
            // Invalidate all agent queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: desktopAgentKeys.all });
        },
    });
}

// ============================================
// SIMULATE AGENT (Development/Testing only)
// ============================================
export function useSimulateAgent() {
    const registerAgent = useRegisterAgent();

    const simulateAgent = async (platform: Platform = 'WINDOWS') => {
        // Generate a unique machine ID
        const machineId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Get machine name based on platform
        const machineNames: Record<Platform, string> = {
            WINDOWS: 'Dev-Windows-PC',
            MAC: 'Dev-MacBook-Pro',
            LINUX: 'Dev-Ubuntu-Desktop',
        };

        return registerAgent.mutateAsync({
            machineId,
            machineName: machineNames[platform],
            platform,
            agentVersion: '1.0.0-dev',
        });
    };

    return {
        simulateAgent,
        isPending: registerAgent.isPending,
        isError: registerAgent.isError,
        error: registerAgent.error,
    };
}

// ============================================
// GET MY AGENTS
// ============================================
export function useMyAgents() {
    return useQuery({
        queryKey: desktopAgentKeys.myAgents(),
        queryFn: () => api.get<DesktopAgent[]>('/desktop-agent/my-agents'),
    });
}

// ============================================
// CHECK IF AGENT IS INSTALLED
// ============================================
export function useAgentCheckInstalled() {
    return useQuery({
        queryKey: desktopAgentKeys.checkInstalled(),
        queryFn: () => api.get<AgentCheckResponse>('/desktop-agent/check-installed'),
        // Refetch every 30 seconds to keep status updated
        refetchInterval: 30 * 1000,
        staleTime: 10 * 1000,
    });
}

// ============================================
// GET DOWNLOAD INFO
// ============================================
export function useAgentDownloadInfo() {
    return useQuery({
        queryKey: desktopAgentKeys.downloadInfo(),
        queryFn: () => api.get<AgentDownloadInfo>('/desktop-agent/download-info'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================
// GET SINGLE AGENT
// ============================================
export function useAgent(id: string) {
    return useQuery({
        queryKey: desktopAgentKeys.detail(id),
        queryFn: () => api.get<DesktopAgent>(`/desktop-agent/${id}`),
        enabled: !!id,
    });
}

// ============================================
// GET ALL COMPANY AGENTS (ADMIN)
// ============================================
export function useCompanyAgents() {
    return useQuery({
        queryKey: desktopAgentKeys.companyAgents(),
        queryFn: () => api.get<DesktopAgent[]>('/desktop-agent/company/all'),
    });
}

// ============================================
// UPDATE AGENT SETTINGS
// ============================================
export function useUpdateAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string;
            data: {
                captureQuality?: number;
                captureAllMonitors?: boolean;
            }
        }) => api.put<DesktopAgent>(`/desktop-agent/${id}`, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: desktopAgentKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: desktopAgentKeys.myAgents() });
        },
    });
}

// ============================================
// DEACTIVATE AGENT
// ============================================
export function useDeactivateAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.post<DesktopAgent>(`/desktop-agent/${id}/deactivate`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: desktopAgentKeys.all });
        },
    });
}

// ============================================
// DELETE AGENT
// ============================================
export function useDeleteAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/desktop-agent/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: desktopAgentKeys.all });
        },
    });
}