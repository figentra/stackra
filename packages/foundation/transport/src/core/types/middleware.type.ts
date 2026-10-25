/**
 * Stackra file contract:
 * Purpose: `Middleware`, one step of the transport pipeline: it may change the request, call `next` zero or more
 *          times, and change or replace the response.
 * Boundary: a type only. A middleware never mutates the request it is given; it passes a copy to `next`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport).
 */
import type { Transport } from "#core/types/transport.type";

/**
 * A pipeline step.
 *
 * @example
 * const logStatus: Middleware = async (request, next) => {
 *   const response = await next(request);
 *   console.info(request.method, request.url, response.status);
 *   return response;
 * };
 */
export type Middleware = (request: Request, next: Transport) => Promise<Response>;
