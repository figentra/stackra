/**
 * Stackra file contract:
 * Purpose: `RouteLoaderInput`, what a test hands `runLoader`: the request URL, the params, the locale, the layout's
 *          data, and any context member's starting state (`session`, `storage`), which a testing part turns into its
 *          fake or which is passed to the context as given.
 * Boundary: a type only; open by its index signature, so a member another package contributes needs no change here.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's layout tests (`runLoader(TabsLayout, { session })`).
 */
import type { Locale } from "@stackra/i18n";

/** The starting state of one loader run. */
export interface RouteLoaderInput {
  /** The request URL; `http://localhost/` when left out. */
  readonly url?: string;

  /** The path params. */
  readonly params?: Readonly<Record<string, unknown>>;

  /** The locale of the mount; `en` when left out. */
  readonly locale?: Locale;

  /** The layout's data, spread into the context. */
  readonly layoutData?: unknown;

  /** A context member's starting state (`session`, `storage`). */
  readonly [member: string]: unknown;
}
