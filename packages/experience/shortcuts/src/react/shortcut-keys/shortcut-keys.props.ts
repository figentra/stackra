/**
 * Stackra file contract:
 * Purpose: `ShortcutKeysProps`, what `ShortcutKeys` takes: a binding (`keys`, as a palette item carries it) or the
 *          shortcut class whose declared binding to draw, and an optional class name.
 * Boundary: a type only; exactly one of `keys` and `shortcut`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (Props in `<name>.props.ts`); the template's palette and shell.
 */
import type { AnyClass } from "@stackra/container";

import type { Shortcut } from "#core/index";

/** The props of the key hint. */
export type ShortcutKeysProps = {
  /** Extra classes on the outer `<kbd>` (`ms-auto` in the palette). */
  readonly className?: string;
} & (
  | {
      /** The binding to draw (`mod+k`, `g s`). */
      readonly keys: string;
      readonly shortcut?: never;
    }
  | {
      /** The shortcut whose declared binding to draw; nothing is drawn for a palette-only shortcut. */
      readonly shortcut: AnyClass<Shortcut>;
      readonly keys?: never;
    }
);
