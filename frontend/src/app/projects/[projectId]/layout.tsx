import { ChatSidebar } from "@/components/layout/ChatSidebar";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar projectId={params.projectId} />
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
