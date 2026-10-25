/**
 * Stackra file contract:
 * Purpose: `assertAnswered`, the split between an authority that answered about the document and one that did not
 *          take it: a server error, throttling or a refused credential throws, every other status returns.
 * Boundary: a pure function; drivers read 2xx and 4xx bodies themselves.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3).
 */
import type { TransportResponse } from "#contracts/types/transport-response.type";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";

/** Statuses that say nothing about the document, so the record stays sealed for a retry. */
const NOT_TAKEN = new Set([401, 403, 408, 429]);

/**
 * Returns the response when it is an answer about the document.
 *
 * @example
 * const response = assertAnswered(await this.transport.send(request), this.key);
 * @throws FiscalAuthorityUnavailableError on 401, 403, 408, 429 or any 5xx.
 */
export function assertAnswered(response: TransportResponse, driver: string): TransportResponse {
  if (response.status >= 500 || NOT_TAKEN.has(response.status))
    throw FiscalAuthorityUnavailableError.create({ driver, status: response.status });
  return response;
}
