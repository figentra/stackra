/**
 * Stackra file contract:
 * Purpose: `FieldAccess`, what a field rule does to the fields it names for its audience: hide them (never read or
 *          written) or make them read-only.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are stored in field rules, so a code never
 *           changes. Hidden is the stronger: a hidden field is also not writable.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3: structured rules); ADR 0294 (decision 16); STA-595 (field-level access).
 */
import { Enum } from "@stackra/contracts";

/** The field-level effects. */
export const FieldAccess = Enum.of({
  /** The field is left out of every read and refused in every write. */
  Hidden: "hidden",
  /** The field is read but refused in every write. */
  ReadOnly: "read_only",
});

/** One of the codes above. */
export type FieldAccess = Enum.Value<typeof FieldAccess>;
