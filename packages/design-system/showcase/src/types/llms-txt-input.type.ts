/**
 * Stackra file contract:
 * Purpose: `LlmsTxtInput`, what `llmsTxt` reads: the entries, one parsed catalogue, the base URL, title and summary.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** What `llmsTxt` reads. */
export interface LlmsTxtInput {
  /** The entries, in listing order. */
  readonly entries: readonly ComponentEntry[];
  /** One parsed `showcase.json`. */
  readonly catalogue: unknown;
  /** The site origin and base, such as "https://ui.stackra.dev". */
  readonly baseUrl: string;
  /** The H1, such as "Stackra UI". */
  readonly title: string;
  /** The blockquote summary. */
  readonly summary: string;
}
