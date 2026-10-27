/**
 * Stackra file contract:
 * Purpose: `AiUsage`, the billing side of one model call or agent run: our reference, the model that served it, the
 *          paying scope and who started it.
 * Boundary: a type only; ids and codes, never prompt or answer text (ADR 0100 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decision 2); ADR 0100 (decision 9); STA-1377 (stackra-219); R-59 (scope vocabulary).
 */
import type { Actor } from "@stackra/contracts";

/** Who pays for one model call or run, and on which model. */
export interface AiUsage {
  /** Our id of the call or run (a run id, a decision's correlation id). */
  readonly reference: string;

  /** The model that served it, `<provider>/<model>` (`bedrock/anthropic.claude-sonnet`); carried as the subject. */
  readonly model: string;

  /** The scope node's public id that pays; absent for a platform call. */
  readonly scopeId?: string;

  /** Who started it. */
  readonly actor?: Actor;
}
