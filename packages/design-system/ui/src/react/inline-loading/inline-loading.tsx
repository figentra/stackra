/**
 * Stackra file contract:
 * Purpose: the web `InlineLoading`: a spinner, a check or an alert icon with its text, for a row-level save or a
 *          payment, inside one polite live region (`role="status"`) that is always in the page, so each change of
 *          state is announced. The icon and text swap with a short scale-and-fade (the spinner-to-check morph) on
 *          Motion, with the theme's `fast` step.
 * Boundary: no styling of its own beyond the inline layout; the icons are the house Spinner and Icon. Reduced motion
 *           swaps at once. The state is the app's: the component never times a success out.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0329 (motion layer); WCAG 2.2 SC 2.3.3,
 *          4.1.3; design-system gap inventory row 28.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { INLINE_LOADING_KEYS } from "#core/constants/inline-loading-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { Spinner } from "#react/spinner/spinner";
import { Text } from "#react/text/text";
import type { InlineLoadingProps } from "#react/inline-loading/inline-loading.props";
import type { TextProps } from "#react/text/text.props";

const FAST = motionTiming(STACKRA_THEME, "fast");

/** Draws Text as a `span`, since the whole component sits inside a sentence or a row. */
const renderSpan: NonNullable<TextProps["render"]> = (domProps) => <span {...domProps} />;

/** How each icon enters and leaves: a small scale with a fade, so the spinner seems to turn into the check. */
const HIDDEN = { opacity: 0, scale: 0.6 } as const;

/** A spinner, then a check or an alert, with its text; every change is announced politely. */
export function InlineLoading({
  status,
  loadingLabel,
  successLabel,
  errorLabel,
  className,
  ...rest
}: InlineLoadingProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const keys = INLINE_LOADING_KEYS.ui.inline_loading;
  const text =
    status === "loading"
      ? (loadingLabel ?? t(keys.loading))
      : status === "success"
        ? (successLabel ?? t(keys.success))
        : status === "error"
          ? (errorLabel ?? t(keys.error))
          : "";

  return (
    <span
      {...rest}
      role="status"
      data-status={status}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "idle" ? null : (
          <motion.span
            key={status}
            className="inline-flex items-center gap-2"
            initial={isReduced ? false : HIDDEN}
            animate={{ opacity: 1, scale: 1 }}
            exit={isReduced ? { opacity: 0, transition: { duration: 0 } } : HIDDEN}
            transition={{ duration: FAST.durationMs / 1000, ease: FAST.bezier ?? "easeOut" }}
          >
            {status === "loading" ? (
              <Spinner size="sm" />
            ) : (
              <Icon
                name={status === "success" ? "circle-check" : "circle-alert"}
                size="sm"
                tone={status === "success" ? "success" : "danger"}
              />
            )}
            <Text
              type="small"
              tone={status === "error" ? "danger" : status === "success" ? "success" : "muted"}
              render={renderSpan}
            >
              {text}
            </Text>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
