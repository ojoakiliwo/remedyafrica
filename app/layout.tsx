'use client';

import * as React from 'react';

// @ts-ignore - next-themes has inconsistent type exports across versions
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Props = React.ComponentPropsWithoutRef<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: Props) {
  return (
    // @ts-ignore
    <NextThemesProvider {...props}>{children}</NextThemesProvider>
  );
}