"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { SessionDetail, StoryWord, WordRating, AnkiEase } from "@/types";

const EASE_LABELS: Record<AnkiEase, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

const EASE_COLORS: Record<AnkiEase, string> = {
  1: "bg-red-200 text-red-800",
  2: "bg-orange-200 text-orange-800",
  3: "bg-green-200 text-green-800",
  4: "bg-blue-200 text-blue-800",
};

const EASE_UNDERLINE: Record<AnkiEase, string> = {
  1: "decoration-red-400",
  2: "decoration-orange-400",
  3: "decoration-green-400",
  4: "decoration-blue-400",
};

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/progress/${id}`)
      .then((r) => r.json())
      .then((data: SessionDetail & { error?: string }) => {
        if (data.error) setError(data.error);
        else setSession(data);
      })
      .catch(() => setError("Failed to load session"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? "Session not found"}</p>
        <Link href="/progress" className="text-indigo-600 underline text-sm">
          Back to Progress
        </Link>
      </div>
    );
  }

  const hasDetail = session.storyWords && session.wordRatings;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/progress"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            &larr; Progress
          </Link>
          <span className="text-xs text-gray-400">
            {new Date(session.createdAt).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {session.storyTitle}
        </h1>
        <p className="text-xs text-gray-400 mb-4">
          Grade {session.storyGradeLevel} &middot; {session.deckName}
        </p>

        {/* Rating summary bar */}
        <RatingSummary session={session} />

        {/* Story with highlighted words */}
        {hasDetail ? (
          <AnnotatedStory
            storyText={session.storyText}
            words={session.storyWords!}
            flashcardIndices={new Set(session.flashcardWordIndices!)}
            ratings={session.wordRatings!}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-gray-400 text-sm mb-4">
              Detailed word data not available for this session.
            </p>
            <div className="prose prose-gray max-w-none text-lg leading-relaxed whitespace-pre-wrap">
              {session.storyText}
            </div>
          </div>
        )}

        {/* New words section */}
        {session.newWords && session.newWords.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              New Words Added
            </h2>
            <div className="space-y-2">
              {session.newWords.map((nw, i) => (
                <div key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium text-purple-700">
                    {nw.baseForm}
                  </span>
                  {nw.surfaceForm !== nw.baseForm && (
                    <span className="text-gray-400">({nw.surfaceForm})</span>
                  )}
                  <span className="text-gray-600">&mdash; {nw.definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty feedback */}
        {session.difficultyFeedback && (
          <p className="text-xs text-gray-400 text-center">
            You rated this story:{" "}
            <span
              className={
                session.difficultyFeedback === "too_easy"
                  ? "text-green-600"
                  : session.difficultyFeedback === "too_hard"
                    ? "text-red-600"
                    : "text-blue-600"
              }
            >
              {session.difficultyFeedback.replace("_", " ")}
            </span>
          </p>
        )}
      </div>
    </main>
  );
}

function RatingSummary({ session }: { session: SessionDetail }) {
  const rb = session.ratingBreakdown;
  const total = rb.again + rb.hard + rb.good + rb.easy;
  if (total === 0) return null;

  const segments: { label: string; count: number; color: string }[] = [
    { label: "Again", count: rb.again, color: "bg-red-400" },
    { label: "Hard", count: rb.hard, color: "bg-orange-400" },
    { label: "Good", count: rb.good, color: "bg-green-400" },
    { label: "Easy", count: rb.easy, color: "bg-blue-400" },
  ];

  return (
    <div className="mb-6">
      <div className="flex rounded-full overflow-hidden h-2 mb-2">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.label}
                className={seg.color}
                style={{ width: `${(seg.count / total) * 100}%` }}
                title={`${seg.label}: ${seg.count}`}
              />
            ),
        )}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <span key={seg.label}>
                {seg.label}: {seg.count}
              </span>
            ),
        )}
      </div>
    </div>
  );
}

function AnnotatedStory({
  storyText,
  words,
  flashcardIndices,
  ratings,
}: {
  storyText: string;
  words: StoryWord[];
  flashcardIndices: Set<number>;
  ratings: WordRating[];
}) {
  // Build rating lookup: wordIndex → ease
  const ratingByWordIndex = useMemo(() => {
    const map = new Map<number, AnkiEase>();
    for (const r of ratings) {
      map.set(r.wordIndex, r.ease);
    }
    return map;
  }, [ratings]);

  // Render tokens
  const elements = useMemo(() => {
    if (words.length === 0) return [<span key="empty">{storyText}</span>];

    const els: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const word of words) {
      if (word.start > lastEnd) {
        els.push(
          <span key={`gap-${lastEnd}`}>
            {storyText.slice(lastEnd, word.start)}
          </span>,
        );
      }

      const isFlashcard = flashcardIndices.has(word.index);
      const ease = ratingByWordIndex.get(word.index);

      if (isFlashcard && ease) {
        els.push(
          <span
            key={`w-${word.index}`}
            className={`underline decoration-2 ${EASE_UNDERLINE[ease]} cursor-default`}
            title={`${word.baseForm ?? word.text}: ${EASE_LABELS[ease]}`}
          >
            {word.text}
          </span>,
        );
      } else if (ease) {
        // Early review word
        els.push(
          <span
            key={`w-${word.index}`}
            className={`underline decoration-2 decoration-dotted ${EASE_UNDERLINE[ease]} cursor-default`}
            title={`${word.baseForm ?? word.text}: ${EASE_LABELS[ease]} (early review)`}
          >
            {word.text}
          </span>,
        );
      } else {
        els.push(<span key={`w-${word.index}`}>{word.text}</span>);
      }

      lastEnd = word.end;
    }

    if (lastEnd < storyText.length) {
      els.push(<span key="trail">{storyText.slice(lastEnd)}</span>);
    }

    return els;
  }, [storyText, words, flashcardIndices, ratingByWordIndex]);

  // Split into paragraphs
  const paragraphs = useMemo(() => {
    const paras: React.ReactNode[][] = [];
    let current: React.ReactNode[] = [];

    for (const el of elements) {
      const text =
        typeof el === "object" && el !== null && "props" in el
          ? String(
              (el as { props?: { children?: unknown } }).props?.children ?? "",
            )
          : "";

      if (text.includes("\n\n")) {
        const parts = text.split("\n\n");
        current.push(<span key={`ps-${current.length}`}>{parts[0]}</span>);
        paras.push(current);
        current = [<span key={`pe-${paras.length}`}>{parts[1]}</span>];
      } else {
        current.push(el);
      }
    }
    if (current.length) paras.push(current);
    return paras;
  }, [elements]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      {/* Legend */}
      <div className="flex gap-3 mb-4 text-xs">
        {([1, 2, 3, 4] as AnkiEase[]).map((ease) => (
          <span
            key={ease}
            className={`px-2 py-0.5 rounded-full ${EASE_COLORS[ease]}`}
          >
            {EASE_LABELS[ease]}
          </span>
        ))}
      </div>

      <div className="prose prose-gray max-w-none text-lg leading-relaxed">
        {paragraphs.map((para, i) => (
          <div key={i} className="mb-4">
            {para}
          </div>
        ))}
      </div>
    </div>
  );
}
