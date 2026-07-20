"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { useChats, useCreateChat } from "@/hooks/useChats";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUpload } from "@/components/projects/DocumentUpload";
import { DocumentList } from "@/components/projects/DocumentList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { formatRelativeTime, truncate } from "@/lib/utils";

export default function ProjectHomePage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const router = useRouter();
  const { t } = useTranslation();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: chats, isLoading: chatsLoading } = useChats(projectId);
  const { data: documents } = useDocuments(projectId);
  const createChat = useCreateChat(projectId);

  async function handleNewChat() {
    const chat = await createChat.mutateAsync({});
    router.push(`/projects/${projectId}/chats/${chat.id}`);
  }

  const recentChats = [...(chats ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-8">
        {projectLoading ? (
          <Skeleton className="h-8 w-56" />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {project?.name}
            </h1>
            {project?.description && (
              <p className="mt-1.5 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
                {project.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t("project.chats")}
            </h2>
            <Button size="sm" onClick={handleNewChat} loading={createChat.isPending}>
              <Plus className="h-3.5 w-3.5" />
              {t("project.newChat")}
            </Button>
          </div>

          {chatsLoading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {!chatsLoading && recentChats.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title={t("project.noChatsTitle")}
              description={t("project.noChatsDesc")}
              action={
                <Button onClick={handleNewChat} loading={createChat.isPending}>
                  <Plus className="h-4 w-4" />
                  {t("project.newChat")}
                </Button>
              }
              className="py-12"
            />
          )}

          {recentChats.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentChats.map((chat) => (
                <Link key={chat.id} href={`/projects/${projectId}/chats/${chat.id}`}>
                  <Card className="p-4 transition duration-200 hover:shadow-soft-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-neutral-400" />
                      <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {chat.title || t("chat.newChat")}
                      </p>
                    </div>
                    <p className="mt-1.5 truncate text-xs text-neutral-400">
                      {chat.last_message
                        ? truncate(chat.last_message, 60)
                        : t("project.noMessagesYet")}
                    </p>
                    <p className="mt-2 text-xs text-neutral-400">
                      {formatRelativeTime(chat.updated_at, t)}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t("project.documents")}{" "}
              <span className="text-neutral-400">({documents?.length ?? 0})</span>
            </h2>
          </div>
          <DocumentUpload projectId={projectId} />
          <div className="mt-4">
            <DocumentList projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}
