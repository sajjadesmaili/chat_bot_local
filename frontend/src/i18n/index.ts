import { en } from "./en";
import { fa } from "./fa";
import type { Locale } from "./locales";
import type { TranslationKey } from "./locales";

const dictionaries = { en, fa } as const;

export type { Locale, TranslationKey };

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  let text: string = dict[key] ?? dictionaries.en[key] ?? key;

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.en;
}
