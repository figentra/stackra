/**
 * Stackra file contract:
 * Purpose: `effectVerdict(effect, reasons, redacted)`, the verdict a guardrail driver answers once it knows what it
 *          caught: pass when nothing, else block on the first reason, flag every reason, or redact and flag.
 * Boundary: pure; internal to the guardrail drivers (not on the entry). `redacted` runs only for the redact effect.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import { GuardrailEffect } from "#core/enums/guardrail-effect.enum";
import type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";

/**
 * The verdict for what a layer caught.
 *
 * @example
 * effectVerdict(GuardrailEffect.Flag, ["email"], () => text); // { pass: true, flags: ["email"] }
 */
export function effectVerdict(
  effect: GuardrailEffect | undefined,
  reasons: readonly string[],
  redacted: () => string,
): GuardrailVerdict {
  const [first] = reasons;
  if (effect === undefined || first === undefined) return { pass: true };
  if (effect === GuardrailEffect.Block) return { pass: false, reason: first };
  if (effect === GuardrailEffect.Flag) return { pass: true, flags: reasons };
  return { pass: true, text: redacted(), flags: reasons };
}
