/**
 * Stackra file contract:
 * Purpose: `runGuardrails(guardrails, text, stage)`, the layered guardrail check: each layer in order on the text the
 *          layer before it let through (redacted or not), collecting flags, stopping at the first that blocks.
 * Boundary: no state of its own; a layer that throws rejects the whole check, so a failing guardrail never lets text
 *           through.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: guardrails are layered); STA-1377 (stackra-219).
 */
import type { Guardrail } from "#core/types/guardrail.type";
import type { GuardrailResult } from "#core/types/guardrail-result.type";

/**
 * Whether `text` passes every layer, and what the model may see of it.
 *
 * @example
 * const result = await runGuardrails([injection, pii], prompt, "input");
 * if (!result.pass) return refuse(result.guardrail);
 * send(result.text);
 */
export async function runGuardrails(
  guardrails: readonly Guardrail[],
  text: string,
  stage: "input" | "output",
): Promise<GuardrailResult> {
  let current = text;
  const flags: { readonly guardrail: string; readonly reason: string }[] = [];
  for (const guardrail of guardrails) {
    const verdict = await guardrail.check(current, stage);
    if (!verdict.pass) return { pass: false, guardrail: guardrail.name, reason: verdict.reason };
    current = verdict.text ?? current;
    for (const reason of verdict.flags ?? []) flags.push({ guardrail: guardrail.name, reason });
  }
  return { pass: true, text: current, flags };
}
