/**
 * Stackra file contract:
 * Purpose: the web `PressableFeedback` compound on HeroUI Pro's PressableFeedback: the pressable root and the
 *          feedback layers Highlight, Ripple, HoldConfirm and ProgressFeedback, with HeroUI Pro's own part names.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The root renders a `button`;
 *          HeroUI Pro's `render` prop passes through. The compound exposes the documented parts: HeroUI Pro's
 *          `PressableFeedback.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { PressableFeedback as HeroPressableFeedback } from "@heroui-pro/react/pressable-feedback";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { PressableFeedbackProps } from "#react/pressable-feedback/pressable-feedback.props";

/** The pressable root: HeroUI Pro's, a `button` that holds the feedback layers. */
// shortcut: the root is typed for its default `button`; HeroUI Pro's generic over other elements returns when a
// caller needs `render` to produce a typed link.
function PressableFeedbackRoot({ isDisabled, ...rest }: PressableFeedbackProps) {
  // HeroUI Pro writes `disabled` as the string "true", which React warns about on a boolean attribute; its own props
  // spread after it, so a real boolean here replaces it.
  return (
    <HeroPressableFeedback.Root
      {...rest}
      {...omitUndefined({ isDisabled })}
      disabled={isDisabled === true}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface PressableFeedbackParts {
  /** A highlight that fades in on hover and press. */
  readonly Highlight: typeof HeroPressableFeedback.Highlight;
  /** A ripple that grows from the press point. */
  readonly Ripple: typeof HeroPressableFeedback.Ripple;
  /** A fill that sweeps across while the pressable is held, then fires `onComplete`. */
  readonly HoldConfirm: typeof HeroPressableFeedback.HoldConfirm;
  /** A fill that sweeps across after a press, then fires `onComplete`. */
  readonly ProgressFeedback: typeof HeroPressableFeedback.ProgressFeedback;
}

/** A pressable surface with touch feedback: `PressableFeedback.Highlight`, `Ripple`, `HoldConfirm`, `ProgressFeedback`. */
export const PressableFeedback: typeof PressableFeedbackRoot & PressableFeedbackParts =
  Object.assign(PressableFeedbackRoot, {
    Highlight: HeroPressableFeedback.Highlight,
    Ripple: HeroPressableFeedback.Ripple,
    HoldConfirm: HeroPressableFeedback.HoldConfirm,
    ProgressFeedback: HeroPressableFeedback.ProgressFeedback,
  });
