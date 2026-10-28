/**
 * Stackra file contract:
 * Purpose: `etaVerdict`, the reading of the Egyptian authority's status answer for a submitted document or receipt:
 *          `Valid` is accepted, `Invalid` or `Rejected` is rejected, anything else (still `Submitted`) is no verdict
 *          yet.
 * Boundary: a pure function over a `TransportResponse` the caller already passed through `assertAnswered`. The status
 *           words are the format's; the URL that answered them is pack data. Reads `status` at the top level or under
 *           `receipt`, so the invoice and the receipt status answers share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3; open question 2: validity polling).
 */
import { z } from "zod";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";

/** The parts of the status answer the verdict reads. */
const ANSWER = z
  .object({
    status: z.string().nullish(),
    receipt: z.object({ status: z.string().nullish() }).nullish(),
  })
  .catch({});

/**
 * The new outcome, or `null` while the authority has not decided.
 *
 * @example
 * const outcome = etaVerdict(assertAnswered(await transport.send(request), "eta"), record.authorityReference);
 */
export function etaVerdict(
  response: TransportResponse,
  reference: string,
): SubmissionOutcome | null {
  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch {
    json = null;
  }
  const answer = ANSWER.parse(json);
  const status = (answer.status ?? answer.receipt?.status ?? "").toLowerCase();
  if (status === "valid")
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: reference,
      message: null,
      payload: null,
    };
  if (status === "invalid" || status === "rejected")
    return {
      status: FiscalRecordStatus.Rejected,
      authorityReference: reference,
      message: status,
      payload: null,
    };
  return null;
}
