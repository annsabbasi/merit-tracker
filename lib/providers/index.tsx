// src/lib/providers/index.tsx
'use client';

import { QueryProvider } from './query-provider';
import { Toaster } from 'sonner';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
        </QueryProvider>
    );
}

export { QueryProvider } from './query-provider';
export { AuthGuard } from './auth-guard';