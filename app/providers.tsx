'use client';

import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/toast-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ToastProvider />
    </AuthProvider>
  );
}