"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useThemeStore } from "@/stores/useThemeStore";
import { useLocaleStore, applyDocumentLocale } from "@/stores/useLocaleStore";
import { CommandPalette } from "@/components/layout/CommandPalette";

function ThemeSync() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  return null;
}

function LocaleSync() {
  const locale = useLocaleStore((state) => state.locale);

  useEffect(() => {
    applyDocumentLocale(locale);
    const root = document.documentElement;
    root.classList.toggle("font-fa", locale === "fa");
    root.classList.toggle("font-en", locale !== "fa");
  }, [locale]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <LocaleSync />
      {children}
      <CommandPalette />
    </QueryClientProvider>
  );
}
