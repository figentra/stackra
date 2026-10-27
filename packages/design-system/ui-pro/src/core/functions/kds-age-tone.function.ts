/**
 * Stackra file contract:
 * Purpose: `kdsAgeTone(minutes, steps)`, the tone a kitchen ticket of a given age is drawn in: the tone of the
 *          highest step it has reached, or `default` below every step.
 * Boundary: internal; pure. The steps are the caller's setting, in any order.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); config-model section 1.
 */
import type { Tone } from "@stackra/ui/contracts";

import type { KdsAgeTone } from "#contracts/types/kds-age-tone.type";

/**
 * The tone of a ticket `minutes` old.
 *
 * @example
 * kdsAgeTone(9, [{ fromMinutes: 5, tone: "warning" }, { fromMinutes: 10, tone: "danger" }]); // "warning"
 */
export function kdsAgeTone(minutes: number, steps: readonly KdsAgeTone[]): Tone {
  let best: KdsAgeTone | undefined;
  for (const step of steps)
    if (minutes >= step.fromMinutes && (best === undefined || step.fromMinutes > best.fromMinutes))
      best = step;
  return best?.tone ?? "default";
}
