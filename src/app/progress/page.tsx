"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import type { SessionRecord, LevelHistoryEntry } from "@/types";
import type { ActivityItem, ActivityType } from "@/app/api/progress/unified/route";

interface ProgressData {
  sessions: SessionRecord[];
  currentLevel: number | null;
  levelHistory: LevelHistoryEntry[];
}

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string; color: string }> = {
  story:     { label: "Story",     icon: "📖", color: "bg-brand-100 text-brand-700" },
  review:    { label: "Review",    icon: "🃏", color: "bg-teal-100 text-teal-700"  },
  writing:   { label: "Writing",   icon: "✏️", color: "bg-amber-100 text-amber-700" },
  dictation: { label: "Listening", icon: "🎧", color: "bg-violet-100 text-violet-700" },
  cloze:     { label: "Cloze",     icon: "🧩", color: "bg-orange-100 text-orange-700" },
  chat:      { label: "Chat",      icon: "💬", color: "bg-sky-100 text-sky-700"    },
};

function ScoreDot({ score }: { score?: number }) {
  if (score === undefined) return null;
  const color = score >= 0.8 ? "bg-accent-teal" : score >= 0.6 ? "bg-accent-sky" : "bg-rating-again";
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} title={`${Math.round(score * 100)}%`} />;
}

export default function ProgressPage() {
  const deckName = useSessionStore((s) => s.deckName);
  const [data, setData] = useState<ProgressData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: "30" });
    if (deckName) params.set("deckName", deckName);

    Promise.all([
      fetch(`/api/progress?${params}`).then((r) => r.json()),
      fetch(`/api/progress/unified?${params}`).then((r) => r.json()),
    ])
      .then(([progressData, unifiedData]: [ProgressData & { error?: string }, { activities?: ActivityItem[]; error?: string }]) => {
        if (progressData.error) setError(progressData.error);
        else setData(progressData);
        if (unifiedData.activities) setActivities(unifiedData.activities);
      })
      .catch(() => setError("Failed to load progress"))
      .finally(() => setLoading(false));
  }, [deckName]);

  const totalWordsStudied = data?.sessions.reduce((sum, s) => sum + s.totalFlashcardWords, 0) ?? 0;
  const totalUnderstood = data?.sessions.reduce((sum, s) => sum + s.ratingBreakdown.good + s.ratingBreakdown.easy, 0) ?? 0;

  const filteredActivities = activeFilter === "all"
    ? activities
    : activities.filter((a) => a.type === activeFilter);

  const activityTypes: (ActivityType | "all")[] = ["all", "story", "review", "writing", "dictation", "cloze", "chat"];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <PageHeader title="Progress" subtitle={deckName ?? "All decks"} />

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Card padding="md">
              <p className="text-2xl font-bold text-brand-600">{activities.length}</p>
              <p className="text-xs text-stone-400 mt-0.5">Total activities</p>
            </Card>
            <Card padding="md">
              <p className="text-2xl font-bold text-stone-900">{totalWordsStudied}</p>
              <p className="text-xs text-stone-400 mt-0.5">Words in stories</p>
            </Card>
            <Card padding="md">
              <p className="text-2xl font-bold text-accent-teal">{totalUnderstood}</p>
              <p className="text-xs text-stone-400 mt-0.5">Understood</p>
            </Card>
          </div>

          {/* Level chart */}
          {data.levelHistory.length > 0 && (
            <Card padding="md" className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-700">Level Progression</h2>
                {data.currentLevel !== null && (
                  <span className="text-lg font-bold text-brand-600">
                    Level {data.currentLevel}
                  </span>
                )}
              </div>
              <MiniLevelChart history={data.levelHistory} />
            </Card>
          )}

          {/* Activity type filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activityTypes.map((type) => {
              const count = type === "all" ? activities.length : activities.filter((a) => a.type === type).length;
              if (type !== "all" && count === 0) return null;
              const cfg = type !== "all" ? ACTIVITY_CONFIG[type] : null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeFilter === type
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cfg ? `${cfg.icon} ${cfg.label}` : "All"} ({count})
                </button>
              );
            })}
          </div>

          {/* Unified activity timeline */}
          <div className="space-y-2">
            {filteredActivities.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-12">
                No activity yet. Start studying!
              </p>
            ) : (
              filteredActivities.map((activity) => {
                const cfg = ACTIVITY_CONFIG[activity.type];
                return (
                  <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} cfg={cfg} />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ActivityRow({
  activity,
  cfg,
}: {
  activity: ActivityItem;
  cfg: { label: string; icon: string; color: string };
}) {
  const inner = (
    <div className="flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-xl hover:border-brand-300 hover:shadow-card transition-all group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${cfg.color}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 group-hover:text-brand-600 transition-colors truncate">
          {activity.title}
        </p>
        <p className="text-xs text-stone-400 truncate">{activity.subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ScoreDot score={activity.score} />
        <span className="text-xs text-stone-400 whitespace-nowrap">
          {new Date(activity.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  if (activity.detailHref) {
    return <Link href={activity.detailHref}>{inner}</Link>;
  }
  return inner;
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
            className="flex-1 bg-brand-500 rounded-t opacity-70 hover:opacity-100 transition-opacity min-h-[4px]"
            style={{ height: `${Math.max(4, heightPct)}%` }}
          />
        );
      })}
    </div>
  );
}
