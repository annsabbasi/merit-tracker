// src/lib/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthCompany, SubscriptionInfo } from '@/lib/types/index';

interface AuthState {
    user: AuthUser | null;
    company: AuthCompany | null;
    subscription: SubscriptionInfo | null;
    token: string | null;
    isAuthenticated: boolean;
    rememberMe: boolean;

    login: (token: string, user: AuthUser, company: AuthCompany, subscription: SubscriptionInfo, rememberMe?: boolean) => void;
    logout: () => void;
    setUser: (user: AuthUser) => void;
    setSubscription: (subscription: SubscriptionInfo) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            company: null,
            subscription: null,
            token: null,
            isAuthenticated: false,
            rememberMe: false,

            login: (token, user, company, subscription, rememberMe = false) => {
                if (rememberMe) {
                    localStorage.setItem('authToken', token);
                    sessionStorage.removeItem('authToken');
                } else {
                    sessionStorage.setItem('authToken', token);
                    localStorage.removeItem('authToken');
                }
                set({ token, user, company, subscription, isAuthenticated: true, rememberMe });
            },

            logout: () => {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                set({
                    token: null,
                    user: null,
                    company: null,
                    subscription: null,
                    isAuthenticated: false,
                    rememberMe: false,
                });
            },

            setUser: (user) => set({ user }),

            setSubscription: (subscription) => set({ subscription }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                company: state.company,
                subscription: state.subscription,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
            }),
        }
    )
);