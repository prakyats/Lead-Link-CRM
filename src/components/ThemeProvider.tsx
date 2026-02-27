import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes@0.4.6";

type Props = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="leadlink-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

