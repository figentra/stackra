/**
 * Stackra file contract:
 * Purpose: `SystemDriverDefault`, one row of `systemDriverDefaults`: a follow-the-system port of a host and the driver
 *          name its wiring sets as that port's `default`.
 * Boundary: a type only; internal to gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); STA-1535; STA-1536.
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** A follow-the-system port of a host and the driver its wiring defaults to. */
export interface SystemDriverDefault {
  /** The port class the wiring binds. */
  readonly port: ClassRef;

  /** The driver name the port takes on this host. */
  readonly driver: string;
}
