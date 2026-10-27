/**
 * Stackra file contract:
 * Purpose: `GuardrailBlockedError`, the refusal `AgentRuntime` raises when a guardrail layer blocks a run's prompt
 *          (`input`) or its answer (`output`). A 403, code `guardrail_blocked`.
 * Boundary: a refusal; it carries the layer's name, the stage and the layer's reason code, never the checked text
 *           (ADR 0100 decision 9). The run is marked failed with this code.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: layered guardrails); ADR 0140 (error envelope); ADR 0294 (decision 20);
 *                     STA-1385.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A guardrail layer blocked the prompt or the answer.
 *
 * @example
 * throw GuardrailBlockedError.create({ guardrail: "injection", stage: "input", reason: "prompt_injection" });
 */
export class GuardrailBlockedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The name of the layer that blocked. */
  guardrail!: string;

  /** Which text it blocked: the prompt or the answer. */
  stage!: "input" | "output";

  /** The layer's reason code. */
  reason!: string;
}
