/**
 * Stackra file contract:
 * Purpose: `CoreRefusals`, the refusals the platform itself raises, keyed by their code, for generated code that
 *          names a refusal by code (`CoreRefusals.bridge_rejected.envelope()` in the desktop preload) and for gen's
 *          manifest, which lists them beside a member's own refusals.
 * Boundary: frozen; each value is the class also exported by name. A key always equals the class's derived code (a
 *           test checks it), so a rename cannot leave a stale key.
 * Runtime: isomorphic
 * Governing contract: ADR 0140, ADR 0232, ADR 0294 (decision 20).
 */
import { BridgeRejectedError } from "#core/errors/bridge-rejected.error";
import { EntitlementRequiredError } from "#core/errors/entitlement-required.error";
import { ForbiddenError } from "#core/errors/forbidden.error";
import { IdempotencyKeyReusedError } from "#core/errors/idempotency-key-reused.error";
import { LiveReadOnlyError } from "#core/errors/live-read-only.error";
import { NotFoundError } from "#core/errors/not-found.error";
import { RateLimitedError } from "#core/errors/rate-limited.error";
import { UnauthenticatedError } from "#core/errors/unauthenticated.error";
import { WorkflowTimedOutError } from "#core/errors/workflow-timed-out.error";

/**
 * The core refusal classes by code.
 *
 * @example
 * CoreRefusals.bridge_rejected.envelope(); // { code: "bridge_rejected", category: "forbidden", retryable: false }
 */
export const CoreRefusals = Object.freeze({
  bridge_rejected: BridgeRejectedError,
  entitlement_required: EntitlementRequiredError,
  forbidden: ForbiddenError,
  idempotency_key_reused: IdempotencyKeyReusedError,
  live_read_only: LiveReadOnlyError,
  not_found: NotFoundError,
  rate_limited: RateLimitedError,
  unauthenticated: UnauthenticatedError,
  workflow_timed_out: WorkflowTimedOutError,
});
