// src/lib/api/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

// export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const BASE_URL = 'http://localhost:4000';

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

const instance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 40000,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    },
});

// Request interceptor - attach token
instance.interceptors.request.use(
    (config) => {
        const auth = useAuthStore.getState();
        let token = auth.token;

        // Check storage if no token in store
        const storedToken =
            typeof window !== 'undefined'
                ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
                : null;

        if (!token && storedToken) {
            useAuthStore.setState({ token: storedToken, isAuthenticated: true });
            token = storedToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });

        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');

            if (typeof window !== 'undefined') {
                // Clear cookies
                document.cookie.split(';').forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, '')
                        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });

                if (!window.location.pathname.includes('/auth')) {
                    window.location.href = '/auth/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

interface RequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: unknown;
    params?: unknown;
    headers?: Record<string, string>;
}

export async function request<T>({
    url,
    method = 'GET',
    data,
    params,
    headers = {},
}: RequestOptions): Promise<T> {
    const requestHeaders: Record<string, string> = { ...headers };

    if (!(data instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    const config: AxiosRequestConfig = {
        method,
        url,
        data,
        params,
        headers: requestHeaders,
    };

    const response: AxiosResponse<T> = await instance.request(config);
    return response.data;
}

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data?.message) {
            return Array.isArray(data.message) ? data.message[0] : data.message;
        }
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
}

// API helper object
export const api = {
    get: <T>(url: string, params?: unknown) =>
        request<T>({ url, method: 'GET', params }),

    post: <T>(url: string, data?: unknown) =>
        request<T>({ url, method: 'POST', data }),

    put: <T>(url: string, data?: unknown) =>
        request<T>({ url, method: 'PUT', data }),

    patch: <T>(url: string, data?: unknown) =>
        request<T>({ url, method: 'PATCH', data }),

    delete: <T>(url: string) =>
        request<T>({ url, method: 'DELETE' }),
};

export default api;