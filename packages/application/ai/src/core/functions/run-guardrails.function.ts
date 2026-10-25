/**
 * Stackra file contract:
 * Purpose: `runGuardrails(guardrails, text, stage)`, the layered guardrail check: each layer in order, stopping at the
 *          first that blocks.
 * Boundary: no state of its own; a layer that throws rejects the whole check, so a failing guardrail never lets text
 *           through.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: guardrails are layered).
 */
import type { Guardrail } from "#core/types/guardrail.type";
import type { GuardrailResult } from "#core/types/guardrail-result.type";

/**
 * Whether `text` passes every layer.
 *
 * @example
 * const result = await runGuardrails([injection, policy], prompt, "input");
 * if (!result.pass) return refuse(result.guardrail);
 */
export async function runGuardrails(
  guardrails: readonly Guardrail[],
  text: string,
  stage: "input" | "output",
): Promise<GuardrailResult> {
  for (const guardrail of guardrails) {
    const verdict = await guardrail.check(text, stage);
    if (!verdict.pass) return { pass: false, guardrail: guardrail.name, reason: verdict.reason };
  }
  return { pass: true };
}
