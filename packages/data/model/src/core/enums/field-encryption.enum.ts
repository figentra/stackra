/**
 * Stackra file contract:
 * Purpose: `FieldEncryption`, how the fields of a data class rest: in clear, sealed by `HasEncryptedFields`, or sealed
 *          under the subject's own key (`HasEncryptedFields({ subject })`) so erasing the subject shreds them.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the eight effects a data class sets. Gen refuses
 *           a field whose class asks for more than its model's `HasEncryptedFields` gives.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 1: the `encrypt` effect); ADR 0465 (decision 5: the model encryption path).
 */
import { Enum } from "@stackra/contracts";

/** How a class's fields rest. */
export const FieldEncryption = Enum.of({
  /** Stored as written. */
  Clear: "clear",
  /** Named by the model's `HasEncryptedFields`, sealed under the scope's or the field's key. */
  Sealed: "sealed",
  /** Named by `HasEncryptedFields({ subject })`, sealed under the subject's own key. */
  SubjectSealed: "subject_sealed",
});

/** One of the codes above. */
export type FieldEncryption = Enum.Value<typeof FieldEncryption>;
