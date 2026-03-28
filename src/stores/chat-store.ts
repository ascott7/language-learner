import { create } from "zustand";
import type { ChatMessage, ChatCorrection } from "@/app/api/chat/route";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  corrections?: ChatCorrection[];
}

interface ChatState {
  messages: StoredMessage[];
  isStreaming: boolean;
  mode: "korean-only" | "mixed";
  language: string;
  error: string | null;

  sendMessage: (text: string) => Promise<void>;
  setMode: (mode: "korean-only" | "mixed") => void;
  setLanguage: (lang: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  mode: "mixed",
  language: "Korean",
  error: null,

  sendMessage: async (text: string) => {
    const { messages, mode, language } = get();

    const userMsg: StoredMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMsg], isStreaming: true, error: null });

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, mode, language }),
      });

      const data = (await res.json()) as { reply?: string; corrections?: ChatCorrection[]; error?: string };
      if (data.error) throw new Error(data.error);

      const assistantMsg: StoredMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.reply ?? "",
        timestamp: Date.now(),
        corrections: data.corrections,
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isStreaming: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to send message", isStreaming: false });
    }
  },

  setMode: (mode) => set({ mode }),
  setLanguage: (lang) => set({ language: lang }),
  clearChat: () => set({ messages: [], error: null }),
}));
