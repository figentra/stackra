/**
 * Stackra file contract:
 * Purpose: `ResolvedPageContext`, a page context after the server has resolved it for a turn: the page's keys as sent,
 *          the facts of the records the caller may read (cut to their allow-lists and the token budget), the readable
 *          selection ids, and how many ids were dropped or left out.
 * Boundary: a type only; model input, so it holds public ids and what the caller may read, never a field the allow-list
 *           does not name (ADR 0490 decision 6). The runtime adds it to the turn; nothing here is stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); STA-1631.
 */
import type { Json } from "@stackra/contracts";

import type { ResolvedPageRecord } from "#core/types/resolved-page-record.type";

/** A page context as the model sees it. */
export interface ResolvedPageContext {
  /** The app member's key. */
  readonly app: string;

  /** The route key. */
  readonly route: string;

  /** The route's path parameters, as sent. */
  readonly params: Readonly<Record<string, string>>;

  /** The records the caller may read and the budget allowed, the page's record first, then the selection's. */
  readonly records: readonly ResolvedPageRecord[];

  /** The selection: its count, the ids the caller may read, and how many ids were dropped as unreadable. */
  readonly selection?: {
    readonly count: number;
    readonly ids: readonly string[];
    readonly dropped: number;
    readonly filter?: Readonly<Record<string, Json>>;
  };

  /** The list filters, as sent. */
  readonly filters?: Readonly<Record<string, Json>>;

  /** The saved view's key. */
  readonly view?: string;

  /** The open action modal's action and field keys. */
  readonly modal?: { readonly action: string; readonly fields: readonly string[] };

  /** How many readable records had their facts left out for the token budget. */
  readonly omitted: number;
}
