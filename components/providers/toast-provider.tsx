'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function ToastProvider() {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#F5F5F0',
          border: '1px solid #E5E5E5',
          color: '#2C3E2D',
        },
      }}
    />
  );
}