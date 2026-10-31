/**
 * Stackra file contract:
 * Purpose: `MockTamoClientOptions`, how the offline mock client behaves: its delay and the tasks it fails on purpose.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoTasks } from "@stackra/ui/contracts";

/** The mock client's options. */
export interface MockTamoClientOptions {
  /** How long each task takes, in milliseconds, so the working state shows. Defaults to 700. */
  readonly delayMs?: number | undefined;
  /** Tasks that fail every time, to show the error state. */
  readonly failing?: readonly (keyof TamoTasks)[] | undefined;
}
