/**
 * Stackra file contract:
 * Purpose: `zatcaOutcome`, a ZATCA answer read as a `SubmissionOutcome`: 200 and 202 accept (202 with warnings), 409
 *          accepts a document already reported, any other answered status rejects with the authority's messages, and
 *          a cleared invoice replaces the payload.
 * Boundary: a pure function behind `assertAnswered`; the body is untrusted and parsed leniently, so a missing field
 *           is a `null`, never a crash.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */
import { z } from "zod";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";
import { fromBase64 } from "#core/functions/from-base64.function";

/** The parts of a ZATCA answer the outcome reads. */
const ANSWER = z
  .object({
    clearedInvoice: z.string().nullish(),
    validationResults: z
      .object({
        warningMessages: z.array(z.object({ message: z.string() })).nullish(),
        errorMessages: z.array(z.object({ message: z.string() })).nullish(),
      })
      .nullish(),
  })
  .catch({});

/**
 * The outcome of one answered submission.
 *
 * @example
 * return zatcaOutcome(assertAnswered(await this.transport.send(request), this.key));
 */
export function zatcaOutcome(response: TransportResponse): SubmissionOutcome {
  let json: unknown;
  try {
    json = JSON.parse(response.body);
  } catch {
    json = null;
  }
  const answer = ANSWER.parse(json);
  const accepted = response.status === 200 || response.status === 202 || response.status === 409;
  const messages = [
    ...(answer.validationResults?.errorMessages ?? []),
    ...(answer.validationResults?.warningMessages ?? []),
  ].map((entry) => entry.message);
  return {
    status: accepted ? FiscalRecordStatus.Accepted : FiscalRecordStatus.Rejected,
    authorityReference: null,
    message:
      messages.length > 0 ? messages.join("; ") : accepted ? null : `HTTP ${response.status}`,
    payload: answer.clearedInvoice
      ? new TextDecoder().decode(fromBase64(answer.clearedInvoice))
      : null,
  };
}
