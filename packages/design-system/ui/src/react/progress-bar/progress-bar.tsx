/**
 * Stackra file contract:
 * Purpose: the web `ProgressBar` on HeroUI v3's ProgressBar root (React Aria): maps the shared contract onto it (no
 *          `value` to `isIndeterminate`, `label` to the accessible name, drawn as a visible label when `isLabelVisible`
 *          is set, and the value text when `isValueVisible` is set) and draws the track as the brand's dot loader: a
 *          row of dots filled from the inline start to the value, the leading dot in the emphasis colour, or, with no
 *          value, the build running along the row.
 * Boundary: HeroUI keeps the root, its role, name, values and text; the dots are drawn here under the loaders'
 *          exception to ADR 0303 decision 6 (owner, 2026-11-02). Reduced motion (the system's or the provider's) shows
 *          an indeterminate row lit and dimmed, at rest. Separate from Spinner: this is the bar.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          ADR 0312; .agents/specs/sta-2017-dot-loader/spec.md (FR-003, FR-006, FR-007); WCAG 2.2 SC 4.1.2.
 */
import { ProgressBar as HeroProgressBar } from "@heroui/react";
import type { ReactElement } from "react";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { DotGrid } from "#react/dot-loader/dot-grid";
import { dotColors } from "#react/dot-loader/dot-colors.function";
import { useDotLoader } from "#react/hooks/use-dot-loader";
import { Label } from "#react/label/label";
import type { ProgressBarProps } from "#react/progress-bar/progress-bar.props";

export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  isLabelVisible,
  isValueVisible,
  style,
  ...rest
}: ProgressBarProps): ReactElement {
  const isIndeterminate = value === undefined;
  const motion = useMotion();
  const isRunning = isIndeterminate && motion === "full";
  const count = DOT_LOADER.barDots[size] ?? DOT_LOADER.barDots.md;
  const building = useDotLoader(count, isRunning);
  const filled = isIndeterminate ? building : dotLoaderFilled(value, minValue, maxValue, count);
  const { color, emphasis } = dotColors(tone);
  return (
    <HeroProgressBar
      {...rest}
      style={
        typeof style === "function"
          ? (state) => ({ minInlineSize: "10rem", ...style(state) })
          : { minInlineSize: "10rem", ...style }
      }
      {...omitUndefined({ value, valueLabel })}
      minValue={minValue}
      maxValue={maxValue}
      size={size}
      color={tone}
      isIndeterminate={isIndeterminate}
      {...(isLabelVisible ? {} : { "aria-label": label })}
    >
      {isLabelVisible ? <Label>{label}</Label> : null}
      {isValueVisible && !isIndeterminate ? <HeroProgressBar.Output /> : null}
      <span
        data-slot="progress-bar-dots"
        style={{
          gridColumn: "1 / -1",
          ...(isIndeterminate && !isRunning ? { opacity: DOT_LOADER.reducedOpacity } : {}),
        }}
      >
        <DotGrid
          cols={count}
          rows={1}
          dot={DOT_LOADER.barDot[size] ?? DOT_LOADER.barDot.md}
          lit={filled}
          emphasisAt={filled - 1}
          color={color}
          emphasis={emphasis}
        />
      </span>
    </HeroProgressBar>
  );
}
