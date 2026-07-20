import type {
  Chat,
  CreateChatPayload,
  CreateProjectPayload,
  DocumentItem,
  HealthStatus,
  LogEntry,
  Message,
  Project,
  Provider,
  Settings,
  Stats,
  UpdateChatPayload,
  UpdateProjectPayload,
  UpdateSettingsPayload,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {
      // response had no json body
    }
    throw new ApiError(
      typeof message === "string" ? message : JSON.stringify(message),
      res.status
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function requestItems<T>(path: string, init?: RequestInit): Promise<T[]> {
  const data = await request<Paginated<T> | T[]>(path, init);
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

function mapProject(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    description: (raw.description as string | null) ?? null,
    chat_count: Number(raw.chat_count ?? 0),
    document_count: Number(raw.document_count ?? 0),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

function mapChat(raw: Record<string, unknown>): Chat {
  return {
    id: String(raw.id),
    project_id: String(raw.project_id),
    title: String(raw.title ?? "New chat"),
    provider: (raw.provider as string | null) ?? null,
    model: (raw.model as string | null) ?? null,
    last_message: (raw.last_message as string | null) ?? null,
    message_count: Number(raw.message_count ?? 0),
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

function mapMessage(raw: Record<string, unknown>): Message {
  return {
    id: String(raw.id),
    chat_id: String(raw.chat_id),
    role: raw.role as Message["role"],
    content: String(raw.content ?? ""),
    provider: (raw.provider as string | null) ?? null,
    model: (raw.model as string | null) ?? null,
    sources: Array.isArray(raw.sources) ? (raw.sources as Message["sources"]) : [],
    created_at: String(raw.created_at ?? ""),
  };
}

function mapDocument(raw: Record<string, unknown>): DocumentItem {
  return {
    id: String(raw.id),
    project_id: String(raw.project_id),
    filename: String(raw.filename ?? raw.original_filename ?? "file"),
    size: Number(raw.size ?? raw.file_size ?? 0),
    status: String(raw.status ?? "ready"),
    chunk_count: Number(raw.chunk_count ?? 0),
    created_at: String(raw.created_at ?? ""),
  };
}

function mapSettings(raw: Record<string, unknown>): Settings {
  return {
    active_provider: String(raw.ai_provider ?? raw.active_provider ?? "ollama"),
    active_model: (raw.chat_model as string) ?? (raw.active_model as string) ?? "",
    embedding_model: (raw.embedding_model as string) ?? "nomic-embed-text",
    temperature: Number(raw.temperature ?? 0.7),
    rag_enabled: Boolean(raw.rag_enabled ?? true),
    rag_confidence_threshold: Number(raw.rag_confidence_threshold ?? 0.55),
    rag_top_k: Number(raw.rag_top_k ?? 5),
    chunk_size: Number(raw.chunk_size ?? 1000),
    chunk_overlap: Number(raw.chunk_overlap ?? 150),
  };
}

function toBackendSettings(payload: UpdateSettingsPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.active_provider !== undefined) body.ai_provider = payload.active_provider;
  if (payload.active_model !== undefined) body.chat_model = payload.active_model;
  if (payload.embedding_model !== undefined) body.embedding_model = payload.embedding_model;
  if (payload.temperature !== undefined) body.temperature = payload.temperature;
  if (payload.rag_enabled !== undefined) body.rag_enabled = payload.rag_enabled;
  if (payload.rag_confidence_threshold !== undefined) {
    body.rag_confidence_threshold = payload.rag_confidence_threshold;
  }
  if (payload.rag_top_k !== undefined) body.rag_top_k = payload.rag_top_k;
  if (payload.chunk_size !== undefined) body.chunk_size = payload.chunk_size;
  if (payload.chunk_overlap !== undefined) body.chunk_overlap = payload.chunk_overlap;
  return body;
}

function mapLog(raw: Record<string, unknown>): LogEntry {
  return {
    id: String(raw.id),
    level: String(raw.level ?? "info").toLowerCase() as LogEntry["level"],
    message: String(raw.message ?? ""),
    source: (raw.category as string) ?? (raw.source as string) ?? undefined,
    created_at: String(raw.created_at ?? ""),
    metadata: (raw.meta as Record<string, unknown>) ?? undefined,
  };
}

function mapStats(raw: Record<string, unknown>): Stats {
  const providerUsage = (raw.provider_usage as Record<string, number>) ?? {};
  return {
    total_projects: Number(raw.total_projects ?? 0),
    total_chats: Number(raw.total_chats ?? 0),
    total_messages: Number(raw.total_messages ?? 0),
    total_documents: Number(raw.total_documents ?? 0),
    active_provider: Object.keys(providerUsage)[0] ?? "ollama",
    providers_available: Object.keys(providerUsage).length,
  };
}

// Health / providers / stats -------------------------------------------------

export const healthApi = {
  get: () => request<HealthStatus>("/health"),
};

export const providersApi = {
  list: async (): Promise<Provider[]> => {
    const detected = await request<
      Array<{
        name: string;
        display_name: string;
        available: boolean;
        models: string[];
      }>
    >("/providers/detect");

    return detected.map((item, index) => ({
      id: String(index + 1),
      name: item.name,
      label: item.display_name,
      available: item.available,
      models: item.models ?? [],
      default_model: item.models?.[0] ?? null,
    }));
  },
};

export const statsApi = {
  get: async () => mapStats((await request<Record<string, unknown>>("/stats")) as Record<string, unknown>),
};

// Projects --------------------------------------------------------------------

export const projectsApi = {
  list: async () =>
    (await requestItems<Record<string, unknown>>("/projects")).map(mapProject),
  get: async (id: string) =>
    mapProject((await request<Record<string, unknown>>(`/projects/${id}`)) as Record<string, unknown>),
  create: async (payload: CreateProjectPayload) =>
    mapProject(
      (await request<Record<string, unknown>>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as Record<string, unknown>
    ),
  update: async (id: string, payload: UpdateProjectPayload) =>
    mapProject(
      (await request<Record<string, unknown>>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })) as Record<string, unknown>
    ),
  remove: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
};

// Chats -------------------------------------------------------------------

export const chatsApi = {
  listByProject: async (projectId: string) =>
    (await requestItems<Record<string, unknown>>(`/projects/${projectId}/chats`)).map(
      mapChat
    ),
  createInProject: async (projectId: string, payload: CreateChatPayload = {}) =>
    mapChat(
      (await request<Record<string, unknown>>(`/projects/${projectId}/chats`, {
        method: "POST",
        body: JSON.stringify(payload),
      })) as Record<string, unknown>
    ),
  get: async (id: string) =>
    mapChat((await request<Record<string, unknown>>(`/chats/${id}`)) as Record<string, unknown>),
  update: async (id: string, payload: UpdateChatPayload) =>
    mapChat(
      (await request<Record<string, unknown>>(`/chats/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })) as Record<string, unknown>
    ),
  remove: (id: string) => request<void>(`/chats/${id}`, { method: "DELETE" }),
  messages: async (chatId: string) =>
    (await requestItems<Record<string, unknown>>(`/chats/${chatId}/messages`)).map(
      mapMessage
    ),
};

// Documents -----------------------------------------------------------------

export const documentsApi = {
  listByProject: async (projectId: string) =>
    (await requestItems<Record<string, unknown>>(`/projects/${projectId}/documents`)).map(
      mapDocument
    ),
  upload: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return mapDocument(
      (await request<Record<string, unknown>>(`/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      })) as Record<string, unknown>
    );
  },
  remove: (documentId: string) =>
    request<void>(`/documents/${documentId}`, { method: "DELETE" }),
};

// Settings ------------------------------------------------------------------

export const settingsApi = {
  get: async () =>
    mapSettings((await request<Record<string, unknown>>("/settings")) as Record<string, unknown>),
  update: async (payload: UpdateSettingsPayload) =>
    mapSettings(
      (await request<Record<string, unknown>>("/settings", {
        method: "PATCH",
        body: JSON.stringify(toBackendSettings(payload)),
      })) as Record<string, unknown>
    ),
};

// Logs ----------------------------------------------------------------------

export const logsApi = {
  list: async (params?: { level?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.level) search.set("level", params.level);
    if (params?.limit) search.set("page_size", String(params.limit));
    const qs = search.toString();
    return (await requestItems<Record<string, unknown>>(`/logs${qs ? `?${qs}` : ""}`)).map(
      mapLog
    );
  },
};
