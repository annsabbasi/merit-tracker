// src/lib/hooks/use-auth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, getErrorMessage } from '@/lib/api/request';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { AuthResponse, LoginRequest, RegisterCompanyRequest, RegisterUserRequest, User, SubscriptionInfo } from '@/lib/types/index';

export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
    subscription: () => [...authKeys.all, 'subscription'] as const,
};

// Login
export function useLogin() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: LoginRequest & { rememberMe?: boolean }) =>
            api.post<AuthResponse>('/login', { email: data.email, password: data.password }),
        onSuccess: (res, variables) => {
            login(res.access_token, res.user, res.company, res.subscription, variables.rememberMe);
            queryClient.clear();
            toast.success(`Welcome back, ${res.user.firstName}!`);
            router.push('/dashboard');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

// Register Company
export function useRegisterCompany() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterCompanyRequest) =>
            api.post<AuthResponse>('/register/company', data),
        onSuccess: (res) => {
            login(res.access_token, res.user, res.company, res.subscription, false);
            queryClient.clear();
            toast.success(`User register successfull And ${res.company.name}! Your 3-day trial has started.`);
            router.push('/login');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

// Register User
export function useRegisterUser() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterUserRequest) =>
            api.post<AuthResponse>('/register/user', data),
        onSuccess: (res) => {
            login(res.access_token, res.user, res.company, res.subscription, false);
            queryClient.clear();
            toast.success(`Welcome to ${res.company.name}, ${res.user.firstName}!`);
            router.push('/dashboard');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });
}

// Get current user
export function useMe() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: authKeys.me(),
        queryFn: () => api.get<User>('/auth/me'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

// Get subscription status
export function useSubscriptionStatus() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setSubscription = useAuthStore((s) => s.setSubscription);

    return useQuery({
        queryKey: authKeys.subscription(),
        queryFn: async () => {
            const data = await api.get<SubscriptionInfo>('/auth/subscription-status');
            setSubscription(data);
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
    });
}

// Logout
export function useLogout() {
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);
    const queryClient = useQueryClient();

    return {
        logout: () => {
            logout();
            queryClient.clear();
            router.push('/login');
        },
    };
}