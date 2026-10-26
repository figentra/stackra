/**
 * Stackra file contract:
 * Purpose: `PackIssueCode`, why a pack fails its publish check: a key no registered schema covers, a key its schema
 *          does not declare, a value its schema refuses, a required key a root pack lacks, and an overlay that drops
 *          or loosens a legal floor of its parent.
 * Boundary: an `Enum.of` value plus the type of the same name. The check returns issues, it never throws, so a pack
 *           author sees every issue at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (section schema registry and the overlay floor check, X2-19); ADR 0370 (decision 6);
 *                     ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The issues of a pack's publish check. */
export const PackIssueCode = Enum.of({
  /** No registered schema's prefix covers the key. */
  KeyUnregistered: "key_unregistered",
  /** The schema that covers the key's prefix does not declare the key. */
  KeyUndeclared: "key_undeclared",
  /** The entry's value does not pass the key's schema. */
  ValueInvalid: "value_invalid",
  /** A root pack has no entry for a key its schema requires. */
  KeyRequired: "key_required",
  /** An overlay entry replaces a parent's floor without a floor of the same bound. */
  FloorDropped: "floor_dropped",
  /** An overlay floor allows what its parent's floor refuses. */
  FloorLoosened: "floor_loosened",
});

/** One of the codes above. */
export type PackIssueCode = Enum.Value<typeof PackIssueCode>;
