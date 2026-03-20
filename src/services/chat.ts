/**
 * Chat / Style Buddy service.
 * Handles session CRUD and SSE streaming for outfit recommendations.
 */
import api from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChatSession {
  sessionId: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  structured_content?: any[];
  product_ids?: string[];
  created_at: string;
}

/** A single SSE chunk from the streaming endpoint */
export interface ChatChunk {
  type: 'text' | 'outfit_start' | 'product' | 'outfit_end' | 'done' | 'error';
  content?: string;
  // outfit_start fields
  name?: string;
  occasion?: string;
  xml?: string;
  // product fields
  productId?: string;
  slot?: string;
  productImageUrl?: string;
  price?: number | null;
  brand?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Session CRUD
// ---------------------------------------------------------------------------
export async function listChatSessions(): Promise<ChatSession[]> {
  const res = await api.get('/api/chat/sessions/');
  return res.data.sessions ?? [];
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  const res = await api.post('/api/chat/sessions/create/', { title: title ?? '' });
  return res.data.session;
}

export async function getChatSession(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
}> {
  const res = await api.get(`/api/chat/sessions/${sessionId}/`);
  return { session: res.data.session, messages: res.data.messages ?? [] };
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await api.delete(`/api/chat/sessions/${sessionId}/delete/`);
}

// ---------------------------------------------------------------------------
// Streaming message endpoint
// ---------------------------------------------------------------------------

/**
 * Send a message and consume the SSE stream.
 *
 * @param sessionId  The chat session UUID.
 * @param message    The user's message text.
 * @param onChunk    Callback invoked for every parsed SSE chunk.
 * @param signal     Optional AbortSignal to cancel the stream.
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  onChunk: (chunk: ChatChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('auth_token');
  const backendUrl =
    (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL : '') + '/fashion';

  const response = await fetch(`${backendUrl}/api/chat/sessions/${sessionId}/message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Chat request failed: ${response.status} ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6); // strip "data: "
      try {
        const chunk: ChatChunk = JSON.parse(jsonStr);
        onChunk(chunk);
      } catch {
        // ignore malformed lines
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    try {
      const chunk: ChatChunk = JSON.parse(buffer.trim().slice(6));
      onChunk(chunk);
    } catch {
      // ignore
    }
  }
}
