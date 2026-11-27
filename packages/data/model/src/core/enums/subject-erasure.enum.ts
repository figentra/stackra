/**
 * Stackra file contract:
 * Purpose: `SubjectErasure`, what erasing a subject does to the fields of a data class: leaves them (`keep`), overwrites
 *          them with null (`anonymise`), deletes their row (`delete`) or destroys the subject key that seals them
 *          (`shred`).
 * Boundary: an `Enum.of` value plus the type of the same name; one of the eight effects a data class sets. A field
 *           whose class erases is the subject's personal data: @stackra/privacy derives a `PersonalData` declaration's
 *           fields from it, and the three erasing codes are `ErasureMethod`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 1: the `erasure` effect; decision 5: `PersonalData` derived); ADR 0189
 *                     (decision 2: erasure).
 */
import { Enum } from "@stackra/contracts";

/** What a subject's erasure does to a class's fields. */
export const SubjectErasure = Enum.of({
  /** Not the subject's personal data: erasure leaves it (a credential goes with its owning record, ADR 0494). */
  Keep: "keep",
  /** Overwritten with null; the row stays. */
  Anonymise: "anonymise",
  /** The row holding the field is deleted. */
  Delete: "delete",
  /** Sealed under the subject's key, whose salt erasure destroys. */
  Shred: "shred",
});

/** One of the codes above. */
export type SubjectErasure = Enum.Value<typeof SubjectErasure>;
