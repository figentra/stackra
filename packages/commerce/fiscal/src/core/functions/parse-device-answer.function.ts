/**
 * Stackra file contract:
 * Purpose: `parseDeviceAnswer`, a fiscal device's answer checked against the shape its driver expects: the trust
 *          boundary between a device and the journal.
 * Boundary: a pure function; an answer of another shape is `FiscalAuthorityUnavailableError` with status 0, so the
 *           sale is not recorded as fiscalised.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 5).
 */
import type { z } from "zod";

import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";

/**
 * The parsed answer.
 *
 * @example
 * const answer = parseDeviceAnswer(TSE_ANSWER, await device.call(unitId, "tse.transaction", payload), this.key);
 * @throws FiscalAuthorityUnavailableError when the answer does not fit.
 */
export function parseDeviceAnswer<S extends z.ZodType>(
  schema: S,
  answer: unknown,
  driver: string,
): z.output<S> {
  const result = schema.safeParse(answer);
  if (!result.success) throw FiscalAuthorityUnavailableError.create({ driver, status: 0 });
  return result.data;
}
