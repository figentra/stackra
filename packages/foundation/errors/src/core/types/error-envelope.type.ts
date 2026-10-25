/**
 * Stackra file contract:
 * Purpose: `ErrorEnvelope`, the one wire shape of a refusal on every transport (HTTP, MCP, CLI, the desktop bridge).
 * Boundary: a type only; `refusal.toEnvelope()` and `X.envelope()` build it. Optional members are absent, never
 *           `undefined`, so the JSON carries only what was set. `details` hold the refusal's declared fields, which
 *           never carry a secret or unclassified personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1), ADR 0232 (decision 2).
 */
import type { ErrorCategory } from "#core/types/error-category.type";
import type { FieldErrors } from "#core/types/field-errors.type";

/** `{ code, category, retryable, details?, fieldErrors?, correlationId?, action? }`. */
export interface ErrorEnvelope {
  /** The snake_case refusal code, derived from the class name (`order_not_payable`). */
  readonly code: string;

  /** One of the ten categories; transports map it to their status. */
  readonly category: ErrorCategory;

  /** Whether the same call may succeed later. */
  readonly retryable: boolean;

  /** The refusal's declared fields that were set. */
  readonly details?: Readonly<Record<string, unknown>>;

  /** The refused input paths and why. */
  readonly fieldErrors?: FieldErrors;

  /** The trace of the call that was refused, for support. */
  readonly correlationId?: string;

  /** The key of the action or query that refused (`orders.order.cancel@1`). */
  readonly action?: string;
}
