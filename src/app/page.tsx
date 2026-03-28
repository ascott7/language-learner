"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import type { SessionRecord } from "@/types";

interface ProgressData {
  sessions: SessionRecord[];
  currentLevel: number | null;
}

interface FeatureCard {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
  stat?: string;
}

const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CardsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SpeakerIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10v4a1 1 0 001 1h2l4 4V5L6 9H4a1 1 0 00-1 1z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const ImportIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const VocabIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export default function Dashboard() {
  const deckName = useSessionStore((s) => s.deckName);
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ days: "30" });
    if (deckName) params.set("deckName", deckName);
    fetch(`/api/progress?${params}`)
      .then((r) => r.json())
      .then((d: ProgressData) => setData(d))
      .catch(() => null);
  }, [deckName]);

  const sessionCount = data?.sessions.length ?? 0;
  const totalWords = data?.sessions.reduce((s, sess) => s + sess.totalFlashcardWords, 0) ?? 0;

  const featureCards: FeatureCard[] = [
    {
      href: "/stories",
      label: "Story Mode",
      description: "Read AI-generated stories built around your due flashcards",
      icon: <BookIcon />,
      accentClass: "bg-brand-600 text-white",
      stat: sessionCount > 0 ? `${sessionCount} sessions` : "Get started",
    },
    {
      href: "/review",
      label: "Flashcard Review",
      description: "Run through your due cards with real Anki SRS scheduling",
      icon: <CardsIcon />,
      accentClass: "bg-accent-teal text-white",
    },
    {
      href: "/write",
      label: "Sentence Writing",
      description: "Write sentences with your vocab words — AI grades your grammar",
      icon: <PencilIcon />,
      accentClass: "bg-amber-500 text-white",
    },
    {
      href: "/chat",
      label: "AI Chat",
      description: "Have a conversation in Korean with an AI language partner",
      icon: <ChatIcon />,
      accentClass: "bg-accent-sky text-white",
    },
    {
      href: "/listen",
      label: "Listening",
      description: "Hear Korean text spoken aloud and type what you hear",
      icon: <SpeakerIcon />,
      accentClass: "bg-violet-500 text-white",
    },
    {
      href: "/cloze",
      label: "Fill in the Blank",
      description: "Restore missing words from stories and imported texts",
      icon: <PuzzleIcon />,
      accentClass: "bg-orange-500 text-white",
    },
    {
      href: "/import",
      label: "Import Text",
      description: "Paste any Korean text and see which words you know",
      icon: <ImportIcon />,
      accentClass: "bg-emerald-500 text-white",
    },
    {
      href: "/vocab",
      label: "Vocabulary",
      description: "Browse all your deck words with mastery and interval data",
      icon: <VocabIcon />,
      accentClass: "bg-rose-500 text-white",
    },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-medium text-stone-400 mb-1">{greeting}</p>
        <h1 className="text-3xl font-display font-bold text-stone-900">
          {deckName ? (
            <>Ready to study <span className="text-gradient-brand">{deckName}</span>?</>
          ) : (
            "What would you like to practice?"
          )}
        </h1>
        {deckName && (
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">{sessionCount}</p>
              <p className="text-xs text-stone-400">Sessions (30d)</p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">{totalWords}</p>
              <p className="text-xs text-stone-400">Words Reviewed</p>
            </div>
            {data?.currentLevel && (
              <>
                <div className="w-px h-8 bg-stone-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-600">{data.currentLevel}</p>
                  <p className="text-xs text-stone-400">Current Level</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {featureCards.map((feature) => (
          <Link key={feature.href} href={feature.href} className="group block">
            <Card variant="interactive" padding="md" className="h-full">
              <div className="flex flex-col h-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${feature.accentClass} group-hover:scale-105 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-stone-900 mb-1">{feature.label}</h3>
                <p className="text-sm text-stone-500 leading-relaxed flex-1">{feature.description}</p>
                {feature.stat && (
                  <p className="text-xs text-brand-600 font-medium mt-3">{feature.stat}</p>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      {data && data.sessions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-stone-700">Recent Stories</h2>
            <Link href="/progress" className="text-sm text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {data.sessions.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                href={`/progress/${session.id}`}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 hover:border-brand-300 hover:shadow-card transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <BookIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800 group-hover:text-brand-600 transition-colors">{session.storyTitle}</p>
                    <p className="text-xs text-stone-400">{new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs text-stone-400">{session.totalFlashcardWords} words</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
