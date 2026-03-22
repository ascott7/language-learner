"use client";

import { useRouter } from "next/navigation";
import { DeckSelector } from "@/components/DeckSelector";
import { useSessionStore } from "@/stores/session-store";

export default function Home() {
  const router = useRouter();
  const setPhase = useSessionStore((s) => s.setPhase);

  function handleStartSession() {
    setPhase("generating");
    router.push("/session");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">
          Language Learner
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Practice vocabulary through stories
        </p>

        <DeckSelector onStartSession={handleStartSession} />
      </div>
    </main>
  );
}
