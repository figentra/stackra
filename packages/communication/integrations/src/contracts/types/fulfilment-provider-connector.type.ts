/**
 * Stackra file contract:
 * Purpose: `FulfilmentProviderConnector`, what a fulfilment provider's Connection implements (a 3PL): hand over an
 *          order once per reference, read its state and cancel it.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.FulfilmentProvider`.
 *           `create` is idempotent on the request's reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); ADR 0356 (decision 2); COM-147.
 */
import type { Fulfilment } from "#contracts/types/fulfilment.type";
import type { FulfilmentRequest } from "#contracts/types/fulfilment-request.type";

/**
 * A fulfilment provider account.
 *
 * @example
 * const fulfilment = await provider.create(request);
 */
export interface FulfilmentProviderConnector {
  /** Hands `request` over; a second call with the same reference returns the first fulfilment. */
  create(request: FulfilmentRequest): Promise<Fulfilment>;

  /** The fulfilment `providerRef` as it is now. */
  status(providerRef: string): Promise<Fulfilment>;

  /** Cancels fulfilment `providerRef` if it has not shipped. */
  cancel(providerRef: string): Promise<Fulfilment>;
}
