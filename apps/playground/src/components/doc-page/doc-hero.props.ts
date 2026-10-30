/**
 * Stackra file contract:
 * Purpose: `DocHeroProps`, the props of `DocHero` in `doc-hero.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ReactNode } from "react";

/** A doc-page hero: words in, already translated. */
export interface DocHeroProps {
  /** The small line above the title: the category name, or "Components". */
  readonly eyebrow: ReactNode;
  /** The page's H1. */
  readonly title: string;
  /** Chips beside the title (status, platforms). */
  readonly chips?: ReactNode;
  /** The benefit-led line. */
  readonly headline: string;
  /** The short paragraph. */
  readonly intro: string;
  /** The tags line ("A · B · C"). */
  readonly tags: string;
  /** The page name in the "Suggest an improvement" issue title. */
  readonly page: string;
  /** The page actions at the top end (view options). */
  readonly actions?: ReactNode;
  /** The live signature demo. */
  readonly demo?: ReactNode;
  /** What sits under the paragraph (links row). */
  readonly footer?: ReactNode;
}
