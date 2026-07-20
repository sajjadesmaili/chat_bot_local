"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useChats, useCreateChat, useDeleteChat, useUpdateChat } from "@/hooks/useChats";
import { useProject } from "@/hooks/useProjects";
import { useTranslation } from "@/hooks/useTranslation";
import { Dropdown } from "@/components/ui/Dropdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime, truncate, cn } from "@/lib/utils";

export function ChatSidebar({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: project } = useProject(projectId);
  const { data: chats, isLoading } = useChats(projectId);
  const createChat = useCreateChat(projectId);
  const deleteChat = useDeleteChat(projectId);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const updateChat = useUpdateChat(renamingId ?? "", projectId);

  const activeChatId = pathname.match(/\/chats\/([^/]+)/)?.[1];

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    if (!search.trim()) return chats;
    return chats.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const sortedChats = useMemo(
    () =>
      [...filteredChats].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [filteredChats]
  );

  async function handleNewChat() {
    const chat = await createChat.mutateAsync({});
    router.push(`/projects/${projectId}/chats/${chat.id}`);
  }

  function startRename(id: string, currentTitle: string) {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      updateChat.mutate({ title: renameValue.trim() });
    }
    setRenamingId(null);
  }

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-e border-neutral-200/70 dark:border-neutral-800">
      <div className="flex h-14 items-center gap-2 px-3">
        <Link
          href="/projects"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition duration-200 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link
          href={`/projects/${projectId}`}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {project?.name ?? <Skeleton className="h-4 w-28" />}
        </Link>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={handleNewChat}
          disabled={createChat.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-3 py-2 text-sm font-medium text-white shadow-soft transition duration-200 hover:bg-accent-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {t("chat.newChat")}
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900">
          <Search className="h-3.5 w-3.5 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("chat.search")}
            className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-200"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-1.5 h-12 w-full" />
          ))}

        {!isLoading && sortedChats.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
            <MessageSquare className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs text-neutral-400">
              {search ? t("chat.noMatch") : t("chat.emptyList")}
            </p>
          </div>
        )}

        {sortedChats.map((chat) => {
          const active = chat.id === activeChatId;
          const isRenaming = renamingId === chat.id;
          return (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-1 rounded-xl px-1 py-0.5 transition duration-200",
                active
                  ? "bg-neutral-100 dark:bg-neutral-800/80"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
              )}
            >
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="w-full rounded-lg border border-accent-400 bg-white px-2.5 py-2 text-sm focus:outline-none dark:bg-neutral-900 dark:text-neutral-100"
                />
              ) : (
                <Link
                  href={`/projects/${projectId}/chats/${chat.id}`}
                  className="min-w-0 flex-1 px-2.5 py-2"
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      active
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300"
                    )}
                  >
                    {chat.title || t("chat.newChat")}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    {chat.last_message
                      ? truncate(chat.last_message, 36)
                      : formatRelativeTime(chat.updated_at, t)}
                  </p>
                </Link>
              )}

              {!isRenaming && (
                <Dropdown
                  trigger={
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition duration-150 hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-200">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  }
                  items={[
                    {
                      label: t("chat.rename"),
                      icon: Pencil,
                      onSelect: () => startRename(chat.id, chat.title),
                    },
                    {
                      label: t("chat.delete"),
                      icon: Trash2,
                      danger: true,
                      onSelect: () => {
                        deleteChat.mutate(chat.id);
                        if (active) router.push(`/projects/${projectId}`);
                      },
                    },
                  ]}
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
