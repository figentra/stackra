/**
 * Stackra file contract:
 * Purpose: `ShortcutClass`, the class `Shortcut({...})` returns and an author extends (`class OpenPaletteShortcut
 *          extends Shortcut({ keys: "mod+k", group }) {}`).
 * Boundary: a type only, one abstract construct signature, so the declaration emit of an author's shortcut names an
 *           exported type (ADR 0305 rule 43). The author's subclass adds its own constructor parameters, which gen
 *           wires by type; it calls `super()` with none.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { Shortcut } from "#core/bases/shortcut.base";

/** A shortcut kind base. */
export type ShortcutClass = abstract new () => Shortcut;
