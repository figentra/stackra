/**
 * Stackra file contract:
 * Purpose: the native `StatusBadge`: a record's state as a neutral `Chip` with a 6 pt dot in the state's tone before
 *          the text, the adapted form HeroUI Native documents (it ships no status component).
 * Boundary: builds on `#native/chip/chip`; the text carries the meaning, the dot repeats it; never a live region.
 *          The dot is a `View` coloured with `useThemeColor`, with no class, so it needs no Uniwind scan.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decisions 3 and 4); WCAG 2.2 SC 1.4.1.
 */
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { Chip } from "#native/chip/chip";
import type { StatusBadgeProps } from "#native/status-badge/status-badge.props";

/** The dot's shape: a 6 pt circle, matching the web badge's 6 px. */
const DOT_SIZE = 6;

/**
 * A record's state: its name as text, with a dot in the state's tone before it. The chip stays neutral so the text
 * keeps its contrast; the dot only repeats the meaning in colour.
 */
export function StatusBadge({ tone = "default", children, ...rest }: StatusBadgeProps) {
  const backgroundColor = useThemeColor(STATUS_DOT_ROLE[tone]);
  return (
    <Chip
      {...rest}
      startIcon={
        <View
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor,
          }}
        />
      }
    >
      {children}
    </Chip>
  );
}
