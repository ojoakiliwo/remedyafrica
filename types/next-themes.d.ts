declare module 'next-themes' {
  import * as React from 'react';
  
  interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    themes?: string[];
    forcedTheme?: string;
    storageKey?: string;
  }
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    resolvedTheme: string | undefined;
    systemTheme: string | undefined;
  };
}