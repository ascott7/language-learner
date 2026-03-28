"use client";

import { useRouter } from "next/navigation";
import { DeckSelector } from "@/components/DeckSelector";
import { useSessionStore } from "@/stores/session-store";
import { PageHeader } from "@/components/layout";

export default function StoriesPage() {
  const router = useRouter();
  const setPhase = useSessionStore((s) => s.setPhase);

  function handleStartSession() {
    setPhase("generating");
    router.push("/stories/session");
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <PageHeader
        title="Story Mode"
        subtitle="Practice vocabulary through AI-generated stories"
      />
      <DeckSelector onStartSession={handleStartSession} />
    </div>
  );
}
