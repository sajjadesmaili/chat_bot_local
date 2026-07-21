"use client";

import { useCallback } from "react";
import { translate, type TranslationKey } from "@/i18n";
import { LOCALE_META } from "@/i18n/locales";
import { useLocaleStore } from "@/stores/useLocaleStore";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const toggleLocale = useLocaleStore((s) => s.toggleLocale);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  return {
    t,
    locale,
    setLocale,
    toggleLocale,
    dir: LOCALE_META[locale].dir,
    isRtl: LOCALE_META[locale].dir === "rtl",
  };
}
