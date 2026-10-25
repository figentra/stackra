/**
 * Stackra file contract:
 * Purpose: `SettingsMode`, how much of the settings an admin sees: developer mode shows every setting with its
 *          provenance and lock, normal mode only the fields a product marks essential.
 * Boundary: an `Enum.of` value plus the type of the same name. Display only: a mode never grants or denies an action
 *           (IAM decides), and a hidden setting keeps its value or default.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 1 and 2).
 */
import { Enum } from "@stackra/contracts";

/** The display modes. */
export const SettingsMode = Enum.of({
  /** Every setting, with provenance and locks. */
  Developer: "developer",
  /** Only the essential settings. */
  Normal: "normal",
});

/** One of the codes above. */
export type SettingsMode = Enum.Value<typeof SettingsMode>;
