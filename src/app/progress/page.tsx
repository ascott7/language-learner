"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import type { SessionRecord, LevelHistoryEntry } from "@/types";

interface ProgressData {
  sessions: SessionRecord[];
  currentLevel: number | null;
  levelHistory: LevelHistoryEntry[];
}

export default function ProgressPage() {
  const deckName = useSessionStore((s) => s.deckName);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deckName) params.set("deckName", deckName);
    params.set("days", "30");

    fetch(`/api/progress?${params.toString()}`)
      .then((r) => r.json())
      .then((d: ProgressData & { error?: string }) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load progress"))
      .finally(() => setLoading(false));
  }, [deckName]);

  const totalWordsStudied =
    data?.sessions.reduce((sum, s) => sum + s.totalFlashcardWords, 0) ?? 0;
  const totalWordsUnderstood =
    data?.sessions.reduce((sum, s) => {
      const rb = s.ratingBreakdown;
      return sum + rb.good + rb.easy;
    }, 0) ?? 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Back
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard
                label="Sessions"
                value={data.sessions.length}
                color="indigo"
              />
              <StatCard
                label="Words Studied"
                value={totalWordsStudied}
                color="blue"
              />
              <StatCard
                label="Understood"
                value={totalWordsUnderstood}
                color="green"
              />
            </div>

            {/* Level chart */}
            {data.levelHistory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-gray-700">
                    Level Progression
                  </h2>
                  {data.currentLevel !== null && (
                    <span className="text-lg font-bold text-indigo-600">
                      Current: {data.currentLevel}
                    </span>
                  )}
                </div>
                <MiniLevelChart history={data.levelHistory} />
              </div>
            )}

            {/* Session history */}
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Recent Sessions
            </h2>
            {data.sessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                No sessions yet. Start studying!
              </p>
            ) : (
              <div className="space-y-3">
                {data.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className={`rounded-xl p-4 ${colorMap[color] ?? ""}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

function SessionRow({ session }: { session: SessionRecord }) {
  const rb = session.ratingBreakdown;
  const understood = rb.good + rb.easy;
  const total = session.totalFlashcardWords;

  return (
    <Link
      href={`/progress/${session.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
          {session.storyTitle}
        </p>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(session.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          {understood}/{total} understood
        </span>
        <span className="text-gray-300">·</span>
        <span>Grade {session.storyGradeLevel}</span>
        {session.newWordsAdded > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-purple-600">+{session.newWordsAdded} new words</span>
          </>
        )}
        {session.difficultyFeedback && (
          <>
            <span className="text-gray-300">·</span>
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
          </>
        )}
      </div>
    </Link>
  );
}

function MiniLevelChart({ history }: { history: LevelHistoryEntry[] }) {
  const reversed = [...history].reverse();
  const levels = reversed.map((h) => h.level);
  const min = Math.max(1, Math.floor(Math.min(...levels)) - 1);
  const max = Math.min(12, Math.ceil(Math.max(...levels)) + 1);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1 h-16">
      {reversed.map((entry, i) => {
        const heightPct = ((entry.level - min) / range) * 100;
        return (
          <div
            key={i}
            title={`Level ${entry.level}: ${entry.reason}`}
            className="flex-1 bg-indigo-400 rounded-t opacity-80 hover:opacity-100 transition-opacity min-h-[4px]"
            style={{ height: `${Math.max(4, heightPct)}%` }}
          />
        );
      })}
    </div>
  );
}
