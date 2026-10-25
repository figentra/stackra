/**
 * Stackra file contract:
 * Purpose: `toneOf(metric, rules)`, the tone a KPI's threshold rules give its metric: the first rule that matches.
 * Boundary: internal: pure; the web dashboard and the native slot import it by path. A rule against the target never
 *           matches a metric without one, and no rule matches a metric without a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15: threshold tones).
 */
import type { Tone } from "@stackra/contracts";

import type { ToneRule } from "#core/types/tone-rule.type";

/**
 * The tone of `metric` under `rules`, or undefined when none matches.
 *
 * @example
 * toneOf({ value: 70, target: 100 }, [{ belowTarget: 0.8, tone: Tone.Danger }]); // "danger"
 */
export function toneOf(
  metric: { readonly value: number | null; readonly target: number | null },
  rules: readonly ToneRule[],
): Tone | undefined {
  const { value, target } = metric;
  if (value === null) return undefined;
  for (const rule of rules) {
    if ("belowTarget" in rule) {
      if (target !== null && value < target * rule.belowTarget) return rule.tone;
    } else if ("aboveTarget" in rule) {
      if (target !== null && value >= target * rule.aboveTarget) return rule.tone;
    } else if ("below" in rule) {
      if (value < rule.below) return rule.tone;
    } else if (value >= rule.above) return rule.tone;
  }
  return undefined;
}
