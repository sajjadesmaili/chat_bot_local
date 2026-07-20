import type { EnDict } from "./en";

export type Locale = "en" | "fa";

export const LOCALES: Locale[] = ["en", "fa"];

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; dir: "ltr" | "rtl"; htmlLang: string }
> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr", htmlLang: "en" },
  fa: { label: "Persian", nativeLabel: "فارسی", dir: "rtl", htmlLang: "fa" },
};

export type TranslationKey = keyof EnDict;
