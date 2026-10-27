/**
 * Stackra file contract:
 * Purpose: `DocsTab`, one top-level tab of a docs site and its navigation groups.
 * Boundary: a type only; `DocsConfig.navigation` lists these, and `emitDocsSite` renders them into `docs.json`
 *           `navigation.tabs`, with the generated API reference tab after them.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); STA-1316.
 */
import type { DocsGroup } from "#core/types/docs-group.type";

/** One top-level tab of a docs site and its navigation groups. */
export type DocsTab = {
  /** The tab's title. */
  readonly tab: string;

  /** A Lucide icon name. */
  readonly icon?: string;

  /** Its groups, in order. */
  readonly groups: readonly DocsGroup[];
};
