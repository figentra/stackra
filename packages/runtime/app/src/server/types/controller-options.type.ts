/**
 * Stackra file contract:
 * Purpose: `ControllerOptions`, what a raw endpoint states in `Controller({ ... })`: its route path, written once.
 * Boundary: a type only. The method set, auth and the rest are the handler's own; gen reads the path from the syntax
 *           tree and locks it in `stackra.manifest.json` (ADR 0294 decision 20).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 16 Controller row, decision 20); http-conventions rule (raw endpoints).
 */

/** The options of `Controller({ ... })`. */
export interface ControllerOptions {
  /** The route path the raw endpoint serves, kebab-case (`/api/auth/*`, `/orders/stream`). */
  readonly path: string;
}
