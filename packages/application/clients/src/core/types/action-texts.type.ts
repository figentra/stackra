/**
 * Stackra file contract:
 * Purpose: `ActionTexts`, the translated texts an action ref declares: the confirmation asked before an L2 call (with
 *          its tone), the success toast and the toast of a call queued offline.
 * Boundary: a type only; every text is a typed key from `#stackra/i18n`, never a literal.
 * Runtime: isomorphic
 * Governing contract: ADR 0139 (confirmation by risk); ADR 0080 (typed i18n keys).
 */
import type { Tone } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";

/** The texts of one action. */
export interface ActionTexts {
  /** Asked before the call runs; a bare key uses the default tone. */
  readonly confirm?: I18nKey | { readonly tone: Tone; readonly text: I18nKey };

  /** Shown when the call succeeds. */
  readonly success?: I18nKey;

  /** Shown when the call was queued offline instead of sent. */
  readonly queued?: I18nKey;
}
