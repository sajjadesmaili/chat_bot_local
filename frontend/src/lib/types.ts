export type ProviderName = "openai" | "ollama" | string;

export interface Provider {
  id: string;
  name: ProviderName;
  label: string;
  available: boolean;
  models: string[];
  default_model?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  chat_count?: number;
  document_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export interface Chat {
  id: string;
  project_id: string;
  title: string;
  provider?: ProviderName | null;
  model?: string | null;
  last_message?: string | null;
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChatPayload {
  title?: string;
}

export interface UpdateChatPayload {
  title?: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface MessageSource {
  document_id: string;
  document_name: string;
  snippet?: string;
  score?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  provider?: ProviderName | null;
  model?: string | null;
  sources?: MessageSource[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  project_id: string;
  filename: string;
  size?: number;
  status: "processing" | "ready" | "failed" | string;
  chunk_count?: number;
  created_at: string;
}

export interface Settings {
  active_provider: ProviderName;
  active_model?: string | null;
  embedding_model?: string | null;
  temperature?: number;
  rag_enabled?: boolean;
  rag_confidence_threshold?: number;
  rag_top_k?: number;
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface UpdateSettingsPayload extends Partial<Settings> {}

export type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Stats {
  total_projects: number;
  total_chats: number;
  total_messages: number;
  total_documents: number;
  active_provider: ProviderName;
  providers_available: number;
  uptime_seconds?: number;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "down" | string;
  version?: string;
  providers?: Record<string, boolean>;
}

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
}
