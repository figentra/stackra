/**
 * Stackra file contract:
 * Purpose: `LeadField`, one field of a lead form: its id (the answer's key), its kind, its label and whether it's
 *          required.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing. The id is
 *           never `consent`, which the consent box takes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { LeadFieldType } from "#core/enums/lead-field-type.enum";

/** A field of the form. */
export interface LeadField<Text = LocalizedText> {
  /** The answer's key in the submission (`name`, `email`, `message`). */
  readonly id: string;

  readonly type: LeadFieldType;

  /** Always shown; a placeholder never replaces it. */
  readonly label: Text;

  readonly isRequired?: boolean;
}
