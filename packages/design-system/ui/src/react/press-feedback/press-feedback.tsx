/**
 * Stackra file contract:
 * Purpose: the web `PressFeedback`: React Aria's Button around any content (a card, a tile), answering a press with a
 *          small shrink (`scale`) or a highlight wash (`highlight`; `ripple`, a touch effect, shows the highlight on
 *          the web), with a focus ring for keyboard users.
 * Boundary: a thin wrapper: every other React Aria Button prop passes through. The answer is a CSS transition of the
 *           theme's `fast` step, none under reduced motion. Put no other control inside it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); owner decision 6 of STA-350 (thin wrappers);
 *          wave 3c mobile interactions (owner approval 2026-10-28).
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { Button as AriaButton } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { PressFeedbackProps } from "#react/press-feedback/press-feedback.props";

/** A pressable surface around any content, with a visible answer to the press. */
export function PressFeedback({
  children,
  onPress,
  label,
  feedback = "scale",
  isDisabled = false,
  className,
  ...rest
}: PressFeedbackProps): ReactElement {
  return (
    <AriaButton
      {...rest}
      isDisabled={isDisabled}
      data-slot="press-feedback"
      {...omitUndefined({ onPress, "aria-label": label })}
      className={(state) =>
        cn(
          "relative block cursor-pointer text-start outline-none transition duration-[var(--duration-fast)] motion-reduce:transition-none",
          state.isFocusVisible && "ring-2 ring-focus",
          state.isPressed && feedback === "scale" && "scale-[0.97]",
          state.isPressed && feedback !== "scale" && "brightness-95",
          isDisabled && "cursor-not-allowed opacity-50",
          typeof className === "function" ? className(state) : className,
        ) ?? ""
      }
    >
      {children}
    </AriaButton>
  );
}
