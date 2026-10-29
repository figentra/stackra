/**
 * Stackra file contract:
 * Purpose: `requestCallOptions(request)`, the call options a generated endpoint lifts from the request's headers:
 *          `idempotencyKey` from `Idempotency-Key` and `consentSnapshot` from `Stackra-Consent` (`CALL_HEADERS`).
 * Boundary: pure. Values are passed as sent and never trusted here: the idempotency step and `ConsentCheck` verify
 *           them. A missing or empty header is left out, so the pipeline's default applies. It never sets the actor, the
 *           scope, the device, the origin or the sandbox: the endpoint adds those from the verified credential (ADR 0098),
 *           as `{ actor, ...requestCallOptions(request) }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (no new pipeline step); ADR 0098 (decisions 6 and 7); ADR 0294 (decision 21: endpoints
 *                     are generated); ADR 0472 (decision 3).
 */
import { CALL_HEADERS } from "#contracts/constants/call-headers.constant";
import type { CallOptions } from "#core/types/call-options.type";

/**
 * The header-borne call options of `request`.
 *
 * @example
 * await pipeline.execute(CancelOrderAction, input, { actor, ...requestCallOptions(request) });
 */
export function requestCallOptions(
  request: Request,
): Pick<CallOptions, "idempotencyKey" | "consentSnapshot"> {
  const idempotencyKey = request.headers.get(CALL_HEADERS.idempotencyKey) ?? "";
  const consentSnapshot = request.headers.get(CALL_HEADERS.consentSnapshot) ?? "";
  return {
    ...(idempotencyKey === "" ? {} : { idempotencyKey }),
    ...(consentSnapshot === "" ? {} : { consentSnapshot }),
  };
}
