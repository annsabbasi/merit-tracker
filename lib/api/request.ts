// src/lib/api/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/lib/stores/auth-store';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
// export const BASE_URL = 'http://localhost:4000';

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
        if (!token && typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (storedToken) {
                // Update the store with found token
                useAuthStore.setState({ token: storedToken, isAuthenticated: true });
                token = storedToken;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            const auth = useAuthStore.getState();

            // Only logout if we're actually authenticated
            // This prevents logout on failed login attempts
            if (auth.isAuthenticated) {
                auth.logout();

                if (typeof window !== 'undefined') {
                    // Clear storage
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');

                    // Clear cookies
                    document.cookie.split(';').forEach((c) => {
                        document.cookie = c
                            .replace(/^ +/, '')
                            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                    });

                    // Redirect to login if not already there
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
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
    const config: AxiosRequestConfig = {
        method,
        url,
        data,
        params,
        headers,
    };

    const response: AxiosResponse<T> = await instance.request(config);
    return response.data;
}

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        // Handle different error response formats
        if (data?.message) {
            // If message is an array, return first item
            if (Array.isArray(data.message)) {
                return data.message[0];
            }
            // If message is a string, return it
            return data.message;
        }

        // Handle error object with error property
        if (data?.error) {
            return typeof data.error === 'string' ? data.error : 'An error occurred';
        }

        // Fallback to axios error message
        if (error.response?.status === 401) {
            return 'Invalid credentials. Please check your email and password.';
        }

        if (error.response?.status === 404) {
            return 'Resource not found';
        }

        if (error.response?.status === 500) {
            return 'Server error. Please try again later.';
        }

        return error.message || 'An unexpected error occurred';
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