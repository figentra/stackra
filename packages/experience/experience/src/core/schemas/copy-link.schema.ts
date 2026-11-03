/**
 * Stackra file contract:
 * Purpose: `CopyLink`, a button that copies a value (the llms.txt URL): its words and the value.
 * Boundary: a shape class only, the field type of the landing blocks; gen compiles it with them. The value is copied
 *           as given, never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** A copy button with its words. */
export class CopyLink extends Schema {
  label!: LocalizedText;

  value!: string;
}
