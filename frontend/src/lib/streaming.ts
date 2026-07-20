import { API_BASE_URL } from "./api";

export interface StreamChunk {
  delta: string;
  done?: boolean;
  provider?: string;
  model?: string;
  error?: string;
}

interface StreamMessageOptions {
  chatId: string;
  content: string;
  regenerate?: boolean;
  signal?: AbortSignal;
  onChunk: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

/**
 * Consumes the backend SSE stream for a chat message.
 * Handles both `data: {json}` and plain-text token frames, and the
 * conventional `data: [DONE]` terminator.
 */
export async function streamChatMessage({
  chatId,
  content,
  regenerate = false,
  signal,
  onChunk,
  onError,
  onDone,
}: StreamMessageOptions): Promise<void> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/chats/${chatId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ content, regenerate }),
        signal,
      }
    );

    if (!res.ok || !res.body) {
      let message = res.statusText || "Streaming request failed";
      try {
        const data = await res.json();
        message = data?.detail || data?.message || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        if (dataLines.length === 0) continue;
        const dataStr = dataLines.join("\n");

        if (dataStr === "[DONE]") {
          onDone?.();
          return;
        }

        const chunk = parseChunk(dataStr);
        if (!chunk) continue;
        if (chunk.done) {
          onChunk(chunk);
          onDone?.();
          return;
        }
        onChunk(chunk);
      }
    }

    onDone?.();
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      onDone?.();
      return;
    }
    onError?.(error as Error);
  }
}

function parseChunk(raw: string): StreamChunk | null {
  try {
    const json = JSON.parse(raw);
    if (typeof json === "string") {
      return { delta: json };
    }
    if (json.error || json.type === "error") {
      return {
        delta: "",
        error: json.error || json.message || "Stream error",
        done: true,
      };
    }
    if (json.type === "done" || json.done === true) {
      return {
        delta: "",
        done: true,
        provider: json.provider,
        model: json.model,
      };
    }
    const delta =
      json.delta ?? json.content ?? json.token ?? json.text ?? "";
    return {
      delta: typeof delta === "string" ? delta : "",
      done: false,
      provider: json.provider,
      model: json.model,
    };
  } catch {
    if (!raw) return null;
    return { delta: raw };
  }
}
