/**
 * Stackra file contract:
 * Purpose: the web `ProgressCircle` on HeroUI v3's ProgressCircle root (React Aria): maps the shared contract onto it
 *          (no `value` to `isIndeterminate`, `label` to `aria-label`) and draws the brand's dot loader in place of the
 *          ring: a 3×3 cell filled in floor order to the value, the leading dot in the emphasis colour, or, with no
 *          value, the build looping as the Spinner's does.
 * Boundary: HeroUI keeps the root, its role, name and values; the dots are drawn here under the loaders' exception to
 *          ADR 0303 decision 6 (owner, 2026-11-02). It draws no text, so its name and value are spoken only. Reduced
 *          motion (the system's or the provider's) shows an indeterminate cell full, dimmed and at rest.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          ADR 0312; .agents/specs/sta-2017-dot-loader/spec.md (FR-004, FR-006, FR-007); WCAG 2.2 SC 4.1.2.
 */
import { ProgressCircle as HeroProgressCircle } from "@heroui/react";
import type { ReactElement } from "react";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { dotLoaderFilled } from "#core/functions/dot-loader-filled.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { DotGrid } from "#react/dot-loader/dot-grid";
import { dotColors } from "#react/dot-loader/dot-colors.function";
import { useDotLoader } from "#react/hooks/use-dot-loader";
import type { ProgressCircleProps } from "#react/progress-circle/progress-circle.props";

export function ProgressCircle({
  value,
  minValue = 0,
  maxValue = 100,
  size = "md",
  tone = "accent",
  label,
  valueLabel,
  ...rest
}: ProgressCircleProps): ReactElement {
  const isIndeterminate = value === undefined;
  const motion = useMotion();
  const isRunning = isIndeterminate && motion === "full";
  const building = useDotLoader(9, isRunning);
  const filled = isIndeterminate ? building : dotLoaderFilled(value, minValue, maxValue, 9);
  const { dot, gap } = DOT_LOADER.circle[size] ?? DOT_LOADER.circle.md;
  const { color, emphasis } = dotColors(tone);
  return (
    <HeroProgressCircle
      {...rest}
      {...omitUndefined({ value, valueLabel })}
      minValue={minValue}
      maxValue={maxValue}
      size={size}
      color={tone}
      isIndeterminate={isIndeterminate}
      aria-label={label}
    >
      <span
        data-slot="progress-circle-dots"
        style={isIndeterminate && !isRunning ? { opacity: DOT_LOADER.reducedOpacity } : undefined}
      >
        <DotGrid
          cols={3}
          rows={3}
          dot={dot}
          gap={gap}
          lit={filled}
          emphasisAt={isIndeterminate ? 8 : filled - 1}
          color={color}
          emphasis={emphasis}
        />
      </span>
    </HeroProgressCircle>
  );
}
