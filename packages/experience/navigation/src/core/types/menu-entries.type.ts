/**
 * Stackra file contract:
 * Purpose: `MenuEntries<M, V>`, a menu's drawable entries narrowed to the kinds its `items` returns (a menu of routes
 *          gives entries with `to`): what the web and native `useMenu` return.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";

/** The entries of menu `M`, narrowed to its item kinds. */
export type MenuEntries<M extends RunnableMenu<V>, V = unknown> = readonly Extract<
  ResolvedMenuItem,
  { readonly kind: ReturnType<M["items"]>[number]["kind"] }
>[];
