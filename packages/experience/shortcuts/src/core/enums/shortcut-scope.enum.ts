/**
 * Stackra file contract:
 * Purpose: `ShortcutScope`, where a registered action listens: the whole app, the current page (paused while an
 *          overlay is open), the topmost overlay, or a focused component.
 * Boundary: an `Enum.of` value plus the type of the same name; snake_case codes.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (scopes); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The scopes, from the widest to the narrowest. */
export const ShortcutScope = Enum.of({
  /** Always listening (the palette, the cheat sheet, Ask Tamo). */
  App: "app",
  /** The current page; paused while a modal, drawer or popover is open. */
  Page: "page",
  /** The topmost open overlay only. */
  Overlay: "overlay",
  /** Only while focus is inside one component. */
  Focus: "focus",
});

/** One of the codes above. */
export type ShortcutScope = Enum.Value<typeof ShortcutScope>;
