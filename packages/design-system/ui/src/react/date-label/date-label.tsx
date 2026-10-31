/**
 * Stackra file contract:
 * Purpose: the web `DateLabel`: a soft Chip holding a `<time>`, that says "Overdue · 3 days ago", "Expires soon ·
 *          tomorrow" or just the date, in the state's tone (danger past, warning soon), with the full date (Hijri when
 *          asked) on hover and read out by screen readers. An overdue or expired label pulses once as it appears.
 * Boundary: the rules are `dateLabelOf`'s; the look is the Chip's. The pulse is Motion's, one scale out and back on
 *           the base step, never a loop, and none under reduced motion or with `isAnimated` off.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0329
 *          (motion layer); ADR 0060 (right-to-left).
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useLocale } from "react-aria-components";

import { DATE_LABEL_KEYS } from "#core/constants/date-label-keys.constant";
import { dateLabelOf } from "#core/functions/date-label-of.function";
import { Chip } from "#react/chip/chip";
import { useUiText } from "#react/hooks/use-ui-text";
import { VisuallyHidden } from "#react/visually-hidden/visually-hidden";
import type { DateLabelProps } from "#react/date-label/date-label.props";

const BASE = motionTiming(STACKRA_THEME, "base");

/** How far the pulse grows. */
const PULSE_SCALE = 1.08;

/** The keys of the words. */
const K = DATE_LABEL_KEYS.ui.date_label;

/** A date as a chip, with its due or expiry state. */
export function DateLabel({
  date,
  kind = "date",
  soonDays = 3,
  isRelative = true,
  calendar = "gregory",
  now,
  size = "sm",
  isAnimated = true,
  variant = "soft",
  ...rest
}: DateLabelProps): ReactElement | null {
  const { locale } = useLocale();
  const t = useUiText();
  // "Now" is read once, when the label mounts: reading the clock on every render would make rendering impure.
  const [mountedAt] = useState(() => new Date());
  const isReduced = useReducedMotion() ?? false;
  const info = dateLabelOf({
    date,
    now: now ?? mountedAt,
    kind,
    soonDays,
    locale,
    calendar,
    isRelative,
  });
  if (!info) return null;
  const text =
    info.state === "none"
      ? info.when
      : t(K.with_state, { state: t(K[info.state]), when: info.when });
  const chip = (
    <Chip {...rest} variant={variant} size={size} tone={info.tone} data-state={info.state}>
      <time dateTime={info.iso} title={info.full}>
        <span aria-hidden="true">{text}</span>
        <VisuallyHidden>{t(K.with_date, { label: text, date: info.full })}</VisuallyHidden>
      </time>
    </Chip>
  );
  const pulses = isAnimated && !isReduced && info.tone === "danger";
  if (!pulses) return chip;
  return (
    // Keyed by the state, so a label that turns overdue while on screen pulses again, once.
    <motion.span
      key={info.state}
      className="inline-flex"
      initial={{ scale: 1 }}
      animate={{ scale: [1, PULSE_SCALE, 1] }}
      transition={{ duration: (BASE.durationMs * 2) / 1000, ease: BASE.bezier ?? "easeInOut" }}
    >
      {chip}
    </motion.span>
  );
}
