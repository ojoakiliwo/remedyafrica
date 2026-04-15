'use client';

import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { Navbar } from '@/components/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
      <ToastProvider />
    </AuthProvider>
  );
}