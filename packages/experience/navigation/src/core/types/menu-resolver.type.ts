/**
 * Stackra file contract:
 * Purpose: `MenuResolver`, a function that turns a menu class (and a value) into its entries ready to draw: what the
 *          web and native `useMenuResolver` return.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";

import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
import type { RunnableMenu } from "#core/types/runnable-menu.type";

/** Resolves one menu class, for an optional value, to its drawable entries. */
export type MenuResolver = <V>(
  type: AnyClass<RunnableMenu<V>>,
  value?: V,
) => readonly ResolvedMenuItem[];
