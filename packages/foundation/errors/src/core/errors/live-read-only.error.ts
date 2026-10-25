/**
 * Stackra file contract:
 * Purpose: `LiveReadOnlyError` (`live_read_only`), the core refusal of a write to structural configuration in a live
 *          environment: structural configuration changes only in a sandbox and reaches live by promotion.
 * Boundary: a core refusal: raised by the tenancy step of the action pipeline when an action declared
 *           `structural: true` runs where the bound `LiveConfigurationGuard` says live is read-only (ADR 0359 decision
 *           3). Kind `Conflict` (the environment's state forbids the change), not retryable: waiting never makes live
 *           writable; the caller promotes from a sandbox or uses break-glass. No details.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 3, 5 and 9); ADR 0140 (envelope and kinds); ADR 0137 (refusal codes; the code
 *                     needs its amendment, see the STA-348 ext-runtime spec).
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/**
 * Live configuration is read-only here.
 *
 * @example
 * throw LiveReadOnlyError.create();
 */
export class LiveReadOnlyError extends Refusal({ kind: ErrorKind.Conflict, retryable: false }) {}
