/**
 * Stackra file contract:
 * Purpose: `encodeEcrMessage`, one ECR request as the bytes the link carries: the profile's request fields in order,
 *          joined by its separator, a field the caller did not give sent empty.
 * Boundary: pure; internal to the ECR terminal driver (not exported from the entry). Framing, acknowledgement and
 *           retries are the link's (ADR 0377 decision 1). Refuses a value holding the separator, which would shift
 *           every later field.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */
import type { EcrProfile } from "#contracts/types/ecr-profile.type";
import type { EcrRequestField } from "#contracts/types/ecr-request-field.type";

/**
 * The request bytes.
 *
 * @example
 * encodeEcrMessage(profile, { operation: profile.operations.sale, reference: "chk_9", amount: "2500" });
 * @throws RangeError when a value contains the profile's separator.
 */
export function encodeEcrMessage(
  profile: EcrProfile,
  values: Readonly<Partial<Record<EcrRequestField, string>>>,
): Uint8Array {
  const fields = profile.request.map((field) => {
    const value = values[field] ?? "";
    if (profile.separator !== "" && value.includes(profile.separator))
      throw new RangeError(`ECR field ${field} contains the separator`);
    return value;
  });
  return new TextEncoder().encode(fields.join(profile.separator));
}
