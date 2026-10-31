/**
 * Stackra file contract:
 * Purpose: `ShortcutHintMode`, how an action shows its keys: `visible` draws a key hint beside the action, `hidden`
 *          puts the keys in the action's tooltip only. Holding Mod reveals badges in either mode.
 * Boundary: an `Enum.of` value plus the type of the same name; snake_case codes.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (hint modes); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The hint modes. */
export const ShortcutHintMode = Enum.of({
  /** A key hint beside the action. */
  Visible: "visible",
  /** The keys in the action's tooltip only. */
  Hidden: "hidden",
});

/** One of the codes above. */
export type ShortcutHintMode = Enum.Value<typeof ShortcutHintMode>;
