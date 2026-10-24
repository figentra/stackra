/**
 * Stackra file contract:
 * Purpose: the web `ProgressBar` on HeroUI v3's ProgressBar (React Aria): maps the shared contract onto it (`tone` to
 *          its colour, no `value` to `isIndeterminate`, `label` to the accessible name, drawn as a visible label when
 *          `isLabelVisible` is set, and the value text when `isValueVisible` is set) and passes every other HeroUI
 *          prop through unchanged.
 * Boundary: no styling of its own; the track, fill, the indeterminate sweep and its reduced-motion rule are HeroUI's,
 *          themed by `@stackra/tokens`. Separate from Spinner: this is the bar, with a value or a sweep.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 4.1.2.
 */
import { ProgressBar as HeroProgressBar, type ProgressBarRootProps } from "@heroui/react";
import type { ReactElement } from "react";

import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Label } from "#react/label/label";

/**
 * Props of the web ProgressBar: the shared contract plus HeroUI v3's own progress bar props, passed through
 * unchanged. HeroUI's `color` is the contract's `tone`, `isIndeterminate` follows from a missing `value`, `label` owns
 * the accessible name, and the parts are drawn here, so `children` is refused; the value's number format is
 * `valueLabel`, so `formatOptions` is too.
 */
export type ProgressBarProps = ProgressBarContractProps &
  Omit<
    ProgressBarRootProps,
    | keyof ProgressBarContractProps
    | "color"
    | "children"
    | "isIndeterminate"
    | "formatOptions"
    | "aria-label"
    | "aria-labelledby"
  >;

/**
 * A bar that fills as work completes: pass `value` for a determinate one, leave it out for an indeterminate sweep.
 * It is always a named `progressbar`; `label` is its name, drawn above the bar with `isLabelVisible`.
 */
export function ProgressBar({
  value,
  minValue,
  maxValue,
  size,
  tone = "accent",
  label,
  valueLabel,
  isLabelVisible,
  isValueVisible,
  ...rest
}: ProgressBarProps): ReactElement {
  return (
    <HeroProgressBar
      {...rest}
      {...omitUndefined({ value, minValue, maxValue, size, valueLabel })}
      color={tone}
      isIndeterminate={value === undefined}
      // A visible label names the bar by React Aria's own link; a hidden one is the `aria-label`.
      {...(isLabelVisible ? {} : { "aria-label": label })}
    >
      {isLabelVisible ? <Label>{label}</Label> : null}
      {isValueVisible && value !== undefined ? <HeroProgressBar.Output /> : null}
      <HeroProgressBar.Track>
        <HeroProgressBar.Fill />
      </HeroProgressBar.Track>
    </HeroProgressBar>
  );
}
