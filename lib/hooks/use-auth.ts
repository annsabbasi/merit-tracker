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
        mutationFn: async (data: LoginRequest & { rememberMe?: boolean }) => {
            const payload = {
                email: data.email.trim(),
                password: data.password
            };

            return api.post<AuthResponse>('/login', payload);
        },
        onSuccess: (res, variables) => {
            // Store token and user data
            login(res.access_token, res.user, res.company, res.subscription, variables.rememberMe);

            // Clear all queries
            queryClient.clear();

            // Show success message
            toast.success(`Welcome back, ${res.user.firstName}!`);

            // Navigate to dashboard
            router.push('/dashboard');
        },
        onError: (error) => {
            // Error is handled by the component displaying it
            console.error('Login error:', error);
        },
    });
}

// Register Company
export function useRegisterCompany() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterCompanyRequest) =>
            api.post<AuthResponse>('/register/company', data),
        onSuccess: (res) => {
            // Clear queries
            queryClient.clear();

            // Show success message
            toast.success(`${res.company.name} registered successfully! Your 3-day trial has started. Please login to continue.`);

            // Redirect to login
            router.push('/login');
        },
        onError: (error) => {
            console.error('Registration error:', error);
        },
    });
}

// Register User
export function useRegisterUser() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterUserRequest) =>
            api.post<AuthResponse>('/register/user', data),
        onSuccess: (res) => {
            // Clear queries
            queryClient.clear();

            // Show success message
            toast.success(`Account created successfully! Please login to continue.`);

            // Redirect to login
            router.push('/login');
        },
        onError: (error) => {
            console.error('Registration error:', error);
        },
    });
}

// Get current user
export function useMe() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return useQuery({
        queryKey: authKeys.me(),
        queryFn: () => api.get<User>('/me'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// Get subscription status
export function useSubscriptionStatus() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setSubscription = useAuthStore((s) => s.setSubscription);

    return useQuery({
        queryKey: authKeys.subscription(),
        queryFn: async () => {
            const data = await api.get<SubscriptionInfo>('/subscription-status');
            setSubscription(data);
            return data;
        },
        enabled: isAuthenticated,
        staleTime: 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
        retry: 1,
    });
}

// Logout
export function useLogout() {
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // Clear auth state
            logout();

            // Clear all queries
            queryClient.clear();

            // Clear all storage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');

                // Clear cookies
                document.cookie.split(';').forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, '')
                        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
            }
        },
        onSuccess: () => {
            toast.success('Logged out successfully');
            router.push('/login');
        },
    });
}