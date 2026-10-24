/**
 * Stackra file contract:
 * Purpose: `BridgeRejectedError`, the core refusal when the desktop renderer invoked a bridge key the preload does not
 *          allow.
 * Boundary: a core refusal: raised by the generated Electron preload and main-process bridge, which re-checks the key,
 *           the sender and the input. Kind `Forbidden`, code `bridge_rejected`, no details, so nothing about the
 *           refused call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0058 (desktop is Electron)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable: an undeclared bridge is never reachable from the renderer. */
export class BridgeRejectedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
