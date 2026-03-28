"use client";

import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { PageHeader } from "@/components/layout";
import { Card, Badge, Skeleton } from "@/components/ui";
import type { VocabWord, VocabStats, MasteryLevel } from "@/app/api/vocab/route";

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; badgeVariant: "default" | "info" | "warning" | "success" | "danger" | "brand" }> = {
  new:      { label: "New",     color: "bg-stone-200",  badgeVariant: "default" },
  learning: { label: "Learning", color: "bg-amber-400", badgeVariant: "warning" },
  young:    { label: "Young",   color: "bg-accent-sky", badgeVariant: "info"    },
  mature:   { label: "Mature",  color: "bg-accent-teal", badgeVariant: "success" },
};

function MasteryBar({ interval }: { interval: number }) {
  const pct = Math.min(100, (interval / 60) * 100);
  const color = interval >= 21 ? "bg-accent-teal" : interval > 0 ? "bg-accent-sky" : "bg-stone-300";
  return (
    <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function VocabPage() {
  const deckName = useSessionStore((s) => s.deckName);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [stats, setStats] = useState<VocabStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [masteryFilter, setMasteryFilter] = useState<MasteryLevel | "all">("all");
  const [sortBy, setSortBy] = useState<"front" | "interval" | "reps" | "lapses">("interval");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    if (!deckName) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/vocab?deckName=${encodeURIComponent(deckName)}`)
      .then((r) => r.json())
      .then((data: { words: VocabWord[]; stats: VocabStats; error?: string }) => {
        if (data.error) setError(data.error);
        else { setWords(data.words); setStats(data.stats); }
      })
      .catch(() => setError("Failed to load vocabulary"))
      .finally(() => setIsLoading(false));
  }, [deckName]);

  const filtered = useMemo(() => {
    let list = words;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((w) => w.front.toLowerCase().includes(q) || w.back.toLowerCase().includes(q));
    }
    if (masteryFilter !== "all") {
      list = list.filter((w) => w.mastery === masteryFilter);
    }
    return [...list].sort((a, b) => {
      if (sortBy === "front") return a.front.localeCompare(b.front);
      if (sortBy === "interval") return b.interval - a.interval;
      if (sortBy === "reps") return b.reps - a.reps;
      if (sortBy === "lapses") return b.lapses - a.lapses;
      return 0;
    });
  }, [words, search, masteryFilter, sortBy]);

  if (!deckName) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-stone-500">Select a deck to view vocabulary.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader title="Vocabulary" subtitle={deckName} />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {(["new", "learning", "young", "mature"] as MasteryLevel[]).map((m) => {
            const cfg = MASTERY_CONFIG[m];
            return (
              <Card key={m} padding="md" variant="interactive" onClick={() => setMasteryFilter(masteryFilter === m ? "all" : m)}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  <div>
                    <p className="text-xl font-bold text-stone-900">{stats[m]}</p>
                    <p className="text-xs text-stone-400">{cfg.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words…"
          className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 flex-1 min-w-48"
        />
        <select
          value={masteryFilter}
          onChange={(e) => setMasteryFilter(e.target.value as MasteryLevel | "all")}
          className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="all">All levels</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="young">Young</option>
          <option value="mature">Mature</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="interval">Sort: Interval</option>
          <option value="front">Sort: Alphabetical</option>
          <option value="reps">Sort: Reviews</option>
          <option value="lapses">Sort: Lapses</option>
        </select>
        <div className="flex rounded-xl border border-stone-300 overflow-hidden">
          {(["table", "grid"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === mode ? "bg-brand-600 text-white" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}
            >
              {mode === "table" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-stone-400 mb-4">{filtered.length} words</p>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} height={52} />)}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>
      )}

      {/* Table view */}
      {!isLoading && !error && viewMode === "table" && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Word</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Definition</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Mastery</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Interval</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((word) => {
                  const cfg = MASTERY_CONFIG[word.mastery];
                  return (
                    <tr key={word.cardId} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-korean font-semibold text-stone-900">{word.front}</td>
                      <td className="px-4 py-3 text-stone-600 max-w-xs truncate">{word.back}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.badgeVariant} size="sm">{cfg.label}</Badge>
                          <MasteryBar interval={word.interval} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-stone-500">{word.interval}d</td>
                      <td className="px-4 py-3 text-right text-stone-500">{word.reps}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-stone-400 py-12 text-sm">No words match your filters.</p>
            )}
          </div>
        </Card>
      )}

      {/* Grid view */}
      {!isLoading && !error && viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((word) => {
            const cfg = MASTERY_CONFIG[word.mastery];
            return (
              <Card key={word.cardId} padding="sm" className="flex flex-col gap-1">
                <p className="font-korean font-bold text-stone-900 text-base leading-tight">{word.front}</p>
                <p className="text-xs text-stone-500 leading-snug line-clamp-2">{word.back}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                  <span className="text-xs text-stone-400">{word.interval}d</span>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-stone-400 py-12 text-sm">No words match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
