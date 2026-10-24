/**
 * Stackra file contract:
 * Purpose: `EntitlementRequiredError`, the core refusal when the tenant is not entitled to a runtime-gated feature.
 * Boundary: a core refusal: raised by the entitlement step of the action pipeline (ADR 0138); a client shows the
 *           upgrade path (ADR 0139, decided by the action's declared experience). Kind `EntitlementRequired`, code
 *           `entitlement_required`, no details, so nothing about the refused call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0138 (pipeline order), ADR
 *                     0139 (the upgrade path)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable: only a plan change alters the answer. */
export class EntitlementRequiredError extends Refusal({
  kind: ErrorKind.EntitlementRequired,
  retryable: false,
}) {}
