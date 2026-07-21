"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function CodeBlock({
  language,
  value,
}: {
  language?: string;
  value: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const theme = useThemeStore((s) => s.theme);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-neutral-200/70 dark:border-neutral-800">
      <div className="flex items-center justify-between bg-neutral-100 px-3.5 py-1.5 dark:bg-neutral-900">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition duration-200",
            copied
              ? "text-success-600 dark:text-success-400"
              : "text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> {t("chat.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> {t("chat.copy")}
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={theme === "dark" ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          fontSize: "13px",
          background: theme === "dark" ? "#18181b" : "#fafafa",
        }}
        wrapLongLines
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
