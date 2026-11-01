/**
 * Stackra file contract:
 * Purpose: `TamoClient`, what runs Tamo's tasks for `TamoProvider`: the host's transport to the AI service (where `decide`,
 *          the prompts and the agent runtime run with the model's credentials), or `createMockTamoClient` offline.
 * Boundary: a type only. A client never runs a model in the browser (ADR 0155: the model's key stays in the service); it
 *           rejects with an `AbortError` when the signal aborts.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoTasks } from "@stackra/ui/contracts";

import type { TamoRunContext } from "#react/tamo/tamo-run-context.type";

/** Runs Tamo's tasks. */
export interface TamoClient {
  /** Runs one Tamo task and resolves with its output; rejects with an `AbortError` when `signal` aborts. */
  readonly run: <K extends keyof TamoTasks>(
    task: K,
    input: TamoTasks[K]["input"],
    signal: AbortSignal,
    context: TamoRunContext,
  ) => Promise<TamoTasks[K]["output"]>;
}
