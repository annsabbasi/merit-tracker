// src/lib/providers/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

const publicRoutes = [
    '/login',
    '/register',
    '/register/company',
    '/register/user',
    '/forgot-password',
    '/reset-password',
];

const authRoutes = [
    '/login',
    '/register',
    '/register/company',
    '/register/user',
];

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, token } = useAuthStore();

    useEffect(() => {
        // Check if token exists in storage on mount
        const storedToken =
            localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        const hasAuth = isAuthenticated || !!storedToken || !!token;
        const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
        const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

        // If on auth route and authenticated, redirect to dashboard
        if (isAuthRoute && hasAuth) {
            router.replace('/dashboard');
            return;
        }

        // If on protected route and not authenticated, redirect to login
        if (!isPublicRoute && !hasAuth) {
            router.replace('/login');
            return;
        }
    }, [isAuthenticated, token, pathname, router]);

    return <>{children}</>;
}