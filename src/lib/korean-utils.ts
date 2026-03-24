/**
 * Lightweight Korean text utilities for client-side fallback matching.
 * Used when kiwipiepy base forms are not available.
 */

// Common Korean particles, sorted longest-first so longer suffixes match before shorter ones
const PARTICLES = [
  "에서부터", "으로부터", "에게서",
  "까지", "부터", "에서", "으로", "한테", "에게",
  "은", "는", "이", "가", "을", "를", "에", "로", "의", "와", "과", "도", "만", "께",
];

/**
 * Strip common Korean particles from a word.
 * This is a lightweight fallback — it handles noun+particle cases
 * but not verb conjugation (use kiwipiepy for that).
 */
export function stripKoreanParticles(text: string): string {
  for (const particle of PARTICLES) {
    if (text.length > particle.length && text.endsWith(particle)) {
      return text.slice(0, -particle.length);
    }
  }
  return text;
}
