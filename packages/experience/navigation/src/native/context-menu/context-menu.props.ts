/**
 * Stackra file contract:
 * Purpose: `ContextMenuProps<V>`, the props of the native `ContextMenu`: the menu class, the value its entries are
 *          built from, and the element that opens it.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0294 (decision 16).
 */
import type { AnyClass } from "@stackra/container";
import type { ReactElement } from "react";

import type { RunnableMenu } from "#core/types/runnable-menu.type";

/** Props of `ContextMenu`. */
export interface ContextMenuProps<V> {
  /** The menu class (`Menu({ kind: MenuKind.Context })`). */
  readonly menu: AnyClass<RunnableMenu<V>>;

  /** The value the entries' params and inputs are built from. */
  readonly value: V;

  /** The pressable element that opens the menu. */
  readonly children: ReactElement;
}
