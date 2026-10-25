/**
 * Stackra file contract:
 * Purpose: `AppDrainingError`, the refusal `ServerApp.handlers.run` answers once the app drains: the instance is
 *          shutting down, so the call goes to another instance (503, retryable).
 * Boundary: a refusal, so the generated adapter maps it to its status and nobody reports it; code `app_draining`.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds); ADR 0295 (decision 8: `drain()`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The server is draining and takes no new call.
 *
 * @example
 * throw AppDrainingError.create();
 */
export class AppDrainingError extends Refusal({ kind: ErrorKind.Unavailable }) {}
