"use client";

import { useEffect, useState } from "react";
import { Check, Cloud, Cpu, Moon, Sun } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useProviders } from "@/hooks/useProviders";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_FORM: Settings = {
  active_provider: "ollama",
  active_model: "qwen3:8b",
  embedding_model: "nomic-embed-text",
  temperature: 0.7,
  rag_enabled: true,
  rag_confidence_threshold: 0.55,
};

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: providers } = useProviders();
  const updateSettings = useUpdateSettings();
  const { theme, setTheme } = useThemeStore();
  const { t, locale, setLocale } = useTranslation();

  const [form, setForm] = useState<Settings>(DEFAULT_FORM);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (settings && !loaded) {
      setForm({ ...DEFAULT_FORM, ...settings });
      setLoaded(true);
    }
  }, [settings, loaded]);

  const activeProvider = providers?.find((p) => p.name === form.active_provider);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await updateSettings.mutateAsync(form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-8 py-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t("settings.subtitle")}
        </p>

        <div className="mt-7 space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("settings.aiProvider")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(providers ?? [{ id: "openai", name: "openai", label: "OpenAI", available: false, models: [] }, { id: "ollama", name: "ollama", label: "Ollama", available: false, models: [] }]).map(
                  (provider) => {
                    const Icon = provider.name.toLowerCase() === "openai" ? Cloud : Cpu;
                    const selected = form.active_provider === provider.name;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => update("active_provider", provider.name)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3.5 text-left transition duration-200",
                          selected
                            ? "border-accent-400 bg-accent-50/60 dark:bg-accent-500/10"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl",
                            provider.available
                              ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                              : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {provider.label}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {provider.available
                              ? t("common.available")
                              : t("common.notDetected")}
                          </p>
                        </div>
                        {selected && <Check className="h-4 w-4 text-accent-600" />}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t("settings.model")}
                </label>
                <Input
                  value={form.active_model ?? ""}
                  onChange={(e) => update("active_model", e.target.value)}
                  placeholder={activeProvider?.default_model || t("settings.modelPlaceholder")}
                  list="model-suggestions"
                />
                {activeProvider?.models && activeProvider.models.length > 0 && (
                  <datalist id="model-suggestions">
                    {activeProvider.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                )}
              </div>

              {form.active_provider === "openai" && (
                <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900/60 dark:text-neutral-400">
                  {t("settings.openaiEnvHint")}
                </p>
              )}

              {form.active_provider === "ollama" && (
                <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900/60 dark:text-neutral-400">
                  {t("settings.ollamaEnvHint")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("settings.generation")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("settings.temperature")}
                  </label>
                  <span className="text-sm text-neutral-500">{form.temperature?.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) => update("temperature", Number(e.target.value))}
                  className="w-full accent-accent-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("settings.rag")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("settings.ragEnable")}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t("settings.ragEnableDesc")}
                  </p>
                </div>
                <Switch
                  checked={form.rag_enabled ?? true}
                  onCheckedChange={(checked) => update("rag_enabled", checked)}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t("settings.confidence")}
                  </label>
                  <span className="text-sm text-neutral-500">
                    {form.rag_confidence_threshold?.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.rag_confidence_threshold}
                  onChange={(e) =>
                    update("rag_confidence_threshold", Number(e.target.value))
                  }
                  className="w-full accent-accent-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("settings.appearance")}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition duration-200",
                    theme === "light"
                      ? "border-accent-400 bg-accent-50/60 text-accent-700"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300"
                  )}
                >
                  <Sun className="h-4 w-4" /> {t("common.light")}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition duration-200",
                    theme === "dark"
                      ? "border-accent-400 bg-accent-500/10 text-accent-400"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300"
                  )}
                >
                  <Moon className="h-4 w-4" /> {t("common.dark")}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("settings.language")}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-neutral-400">{t("settings.languageDesc")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLocale("fa")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition duration-200",
                    locale === "fa"
                      ? "border-accent-400 bg-accent-50/60 text-accent-700"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300"
                  )}
                >
                  {t("common.persian")}
                </button>
                <button
                  onClick={() => setLocale("en")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition duration-200",
                    locale === "en"
                      ? "border-accent-400 bg-accent-500/10 text-accent-400"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-300"
                  )}
                >
                  {t("common.english")}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-4">
            {savedAt && (
              <span className="flex items-center gap-1.5 text-sm text-success-600 dark:text-success-400">
                <Check className="h-4 w-4" /> {t("common.saved")}
              </span>
            )}
            <Button onClick={handleSave} loading={updateSettings.isPending}>
              {t("settings.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
