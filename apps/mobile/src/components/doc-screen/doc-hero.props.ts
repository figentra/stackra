/**
 * Stackra file contract:
 * Purpose: `DocHeroProps`, the props of the native `DocHero` in `doc-hero.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ReactNode } from "react";

/** The hero's words. */
export interface DocHeroProps {
  /** Chips above the headline. */
  readonly chips?: ReactNode;
  /** The page's headline, already translated. */
  readonly headline: string;
  /** The paragraph under the headline, already translated. */
  readonly intro: string;
  /** "A · B · C". */
  readonly tags: string;
  /** The page name in the issue title. */
  readonly page: string;
  /** Lines the intro to a few on a phone; undefined shows it all. */
  readonly introLines?: number;
}
