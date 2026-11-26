/**
 * Stackra file contract:
 * Purpose: `CopyLink`, a button that copies a value (the llms.txt URL): its words and the value.
 * Boundary: a type only, the field type of the landing blocks. The value is copied as given, never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A copy button with its words. */
export interface CopyLink {
  /** The button's words. */
  readonly label: LocalizedText;

  /** What the button copies, as given. */
  readonly value: string;
}
