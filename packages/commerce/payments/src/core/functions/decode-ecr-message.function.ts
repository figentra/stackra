/**
 * Stackra file contract:
 * Purpose: `decodeEcrMessage`, a terminal's answer bytes read into the profile's response fields by position, each
 *          value trimmed; `blank` positions and missing trailing fields are left out.
 * Boundary: pure; internal to the ECR terminal driver (not exported from the entry). It reads; what the values mean is
 *           the driver's.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */
import type { EcrProfile } from "#contracts/types/ecr-profile.type";
import type { EcrResponseField } from "#contracts/types/ecr-response-field.type";
import type { EcrAnswer } from "#core/types/ecr-answer.type";

/**
 * The answer's fields.
 *
 * @example
 * const answer = decodeEcrMessage(profile, bytes); // { reference: "chk_9", result: "00", amount: "2500" }
 */
export function decodeEcrMessage(profile: EcrProfile, bytes: Uint8Array): EcrAnswer {
  const parts = new TextDecoder().decode(bytes).split(profile.separator);
  const answer: Partial<Record<EcrResponseField, string>> = {};
  profile.response.forEach((field, index) => {
    const value = parts[index]?.trim();
    if (field !== "blank" && value !== undefined && value !== "") answer[field] = value;
  });
  return answer;
}
