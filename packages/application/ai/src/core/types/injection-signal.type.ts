/**
 * Stackra file contract:
 * Purpose: `InjectionSignal`, one sign that untrusted text tries to steer the model ("ignore the previous
 *          instructions", a fake system turn, a request to reveal the prompt) and how much it counts toward the
 *          prompt-injection score.
 * Boundary: a type only. The phrases are data: the platform floor holds the common ones, a market pack its language's
 *           (Arabic included); none is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4); ADR 0450 (a page reading is untrusted data); STA-1377 (stackra-219).
 */
import type { RedactionRule } from "#core/types/redaction-rule.type";

/** One prompt-injection signal: a pattern (its name is the flag) and its weight. */
export interface InjectionSignal extends RedactionRule {
  /** What a match adds to the score. */
  readonly weight: number;
}
