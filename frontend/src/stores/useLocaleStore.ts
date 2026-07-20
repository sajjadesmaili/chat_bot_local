import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCALE_META, type Locale } from "@/i18n/locales";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "fa",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set({ locale: get().locale === "fa" ? "en" : "fa" }),
    }),
    {
      name: "chatbot-locale",
    }
  )
);

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const meta = LOCALE_META[locale];
  const root = document.documentElement;
  root.lang = meta.htmlLang;
  root.dir = meta.dir;
}
