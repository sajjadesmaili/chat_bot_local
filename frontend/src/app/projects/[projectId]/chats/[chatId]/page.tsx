import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage({
  params,
}: {
  params: { projectId: string; chatId: string };
}) {
  return <ChatWindow chatId={params.chatId} projectId={params.projectId} />;
}
