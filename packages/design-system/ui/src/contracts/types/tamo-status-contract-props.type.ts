/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoStatusLine` takes: the one working, Stop, Try again and error line every Tamo part
 *          shows.
 * Boundary: types only; it draws nothing while idle or ready.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { TamoStatus } from "#contracts/enums/tamo-status.enum";

/** Props shared by the web and native `TamoStatusLine`. */
export interface TamoStatusContractProps {
  /** The task's state. */
  readonly status: TamoStatus;
  /** Shown while working, with Stop. */
  readonly onStop?: (() => void) | undefined;
  /** Shown on error, with Try again. */
  readonly onRetry?: (() => void) | undefined;
  /** The error's words; defaults to the catalogue's. */
  readonly errorMessage?: string | undefined;
  /** The working words; defaults to "Tamo is working…". */
  readonly workingLabel?: string | undefined;
}
