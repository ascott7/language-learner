"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { useSessionStore } from "@/stores/session-store";
import { GrammarBreakdown } from "@/components/grammar/GrammarBreakdown";
import { Button } from "@/components/ui";

const STARTER_PROMPTS = [
  "오늘 날씨가 어때요?",
  "한국어 공부가 어떻게 되고 있어요?",
  "주말에 뭐 할 거예요?",
  "좋아하는 한국 음식이 뭐예요?",
];

export default function ChatPage() {
  const language = useSessionStore((s) => s.language);
  const { messages, isStreaming, mode, error, sendMessage, setMode, clearChat } = useChatStore();
  const [input, setInput] = useState("");
  const [grammarSentence, setGrammarSentence] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Render assistant message with tappable sentences
  function renderAssistantContent(content: string) {
    // Split on sentence boundaries but preserve them
    const sentences = content.split(/(?<=[.!?。！？\n])\s*/);
    return sentences.map((sentence, i) => {
      const isKorean = /[\uAC00-\uD7AF]/.test(sentence);
      return (
        <span
          key={i}
          className={`${isKorean ? "cursor-pointer hover:bg-sky-50 hover:text-sky-800 rounded px-0.5 transition-colors" : ""}`}
          onClick={() => {
            if (isKorean && sentence.trim()) {
              setGrammarSentence(sentence.trim());
            }
          }}
          title={isKorean ? "Tap to analyze grammar" : undefined}
        >
          {sentence}
        </span>
      );
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-stone-900">AI Chat</h1>
            <p className="text-sm text-stone-400">Practice {language} conversation</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode toggle */}
            <div className="flex rounded-xl border border-stone-300 overflow-hidden">
              {(["mixed", "korean-only"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === m ? "bg-brand-600 text-white" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}
                >
                  {m === "mixed" ? "Mixed" : "Korean only"}
                </button>
              ))}
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>Clear</Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-card-lg">
              <span className="text-white text-2xl font-korean font-bold">한</span>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-stone-700 mb-1">Start a conversation</p>
              <p className="text-sm text-stone-400">Tap a prompt or type your own message</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); inputRef.current?.focus(); }}
                  className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-korean text-stone-700 hover:border-brand-300 hover:bg-brand-50 transition-colors shadow-card"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-card"
              }`}>
                <p className={`font-korean leading-relaxed text-sm whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-stone-800"}`}>
                  {msg.role === "assistant" ? renderAssistantContent(msg.content) : msg.content}
                </p>
                {msg.corrections && msg.corrections.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-stone-200">
                    {msg.corrections.map((c, i) => (
                      <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
                        {c.explanation}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <p className="text-rating-again text-sm text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-stone-200">
        {messages.length > 0 && (
          <p className="text-xs text-stone-400 mb-2">
            Tap Korean sentences in AI replies to analyze grammar
          </p>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-600 font-korean resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 h-[52px] px-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>

      <GrammarBreakdown
        sentence={grammarSentence ?? ""}
        open={grammarSentence !== null}
        onClose={() => setGrammarSentence(null)}
      />
    </div>
  );
}
