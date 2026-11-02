/**
 * Stackra file contract:
 * Purpose: the native `Spinner`: the brand's dot loader, a 3×3 cell of dots that builds the st tile's floors, lit one
 *          80 ms step at a time with the ninth dot in the emphasis colour, held, then cleared. `tone` colours the dots,
 *          `size` sets the cell (16, 24 or 32 points), `label` names it for VoiceOver and TalkBack, or it is hidden
 *          when there is none, and every other view prop passes through.
 * Boundary: draws its own dots under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02). Reduced motion
 *          (the system's or the provider's) shows the full cell at rest, dimmed. Must sit inside the native
 *          `DesignSystemProvider`.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          .agents/specs/sta-2017-dot-loader/spec.md (FR-002, FR-006, FR-007); figentra/brand rules §41.
 */
import { useThemeColor } from "heroui-native";
import type { ReactElement } from "react";
import { View } from "react-native";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { useMotion } from "#native/design-system-provider/use-motion";
import { DotGrid } from "#native/dot-loader/dot-grid";
import { useDotLoader } from "#native/hooks/use-dot-loader";
import type { SpinnerProps } from "#native/spinner/spinner.props";

const HIDDEN = Object.freeze({
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const);

/** The dot loader's indeterminate cell, named by `label` or hidden. */
export function Spinner({
  size = "md",
  tone = "accent",
  label,
  style,
  ...rest
}: SpinnerProps): ReactElement {
  const isRunning = useMotion() === "full";
  const lit = useDotLoader(9, isRunning);
  // shortcut: the emphasis dot takes the tone's colour until @stackra/tokens ships the native core colour (STA-2015).
  const color = useThemeColor(tone === "default" ? "foreground" : tone);
  // An unknown size (a caller past the types) draws md, as HeroUI did, instead of throwing.
  const { dot, gap } = DOT_LOADER.cell[size] ?? DOT_LOADER.cell.md;
  return (
    <View
      {...rest}
      style={[isRunning ? null : { opacity: DOT_LOADER.reducedOpacity }, style]}
      {...(label
        ? {
            accessible: true,
            accessibilityRole: "progressbar" as const,
            accessibilityLabel: label,
            accessibilityState: { busy: true },
          }
        : HIDDEN)}
    >
      <DotGrid
        cols={3}
        rows={3}
        dot={dot}
        gap={gap}
        lit={lit}
        emphasisAt={8}
        color={color}
        emphasis={color}
      />
    </View>
  );
}
