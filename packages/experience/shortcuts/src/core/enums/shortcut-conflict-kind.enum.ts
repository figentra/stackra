/**
 * Stackra file contract:
 * Purpose: `ShortcutConflictKind`, why two key bindings cannot both be bound: the same keys, or one binding is the
 *          start of the other's chord, so the longer one could never be pressed.
 * Boundary: an `Enum.of` value plus the type of the same name; snake_case codes.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case codes); registry v3.1 final review H (gen conflict checks).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of key-binding conflict. */
export const ShortcutConflictKind = Enum.of({
  /** Both bindings are the same keys on at least one platform (`mod+k` and `meta+k` on Apple devices). */
  Same: "same",
  /** One binding is the first steps of the other's chord (`g` and `g s`). */
  Prefix: "prefix",
});

/** One of the codes above. */
export type ShortcutConflictKind = Enum.Value<typeof ShortcutConflictKind>;
