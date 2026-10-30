/**
 * Stackra file contract:
 * Purpose: the native `PageIndicator`: the dots under a carousel or an onboarding pager, the current one stretched
 *          (`PageIndicatorDot`). With `onChange` each dot is a button with a 24-point target going to its page, the
 *          current one selected; without, the row is one image named "Page 2 of 5".
 * Boundary: a flex row, so React Native mirrors it in right-to-left: page one is at the right in Arabic.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { PageIndicatorDot } from "#native/page-indicator/page-indicator-dot";
import type { PageIndicatorProps } from "#native/page-indicator/page-indicator.props";

/** The indicator's words. */
const K = LONG_TAIL_KEYS.ui.page_indicator;

/** The dots under a carousel or pager, the current page stretched. */
export function PageIndicator({
  count,
  index,
  onChange,
  label,
  getPageLabel,
  className,
}: PageIndicatorProps): ReactElement {
  const t = useUiText();
  const nameOf = (page: number) => getPageLabel?.(page, count) ?? t(K.page, { index: page, count });
  const pages = Array.from({ length: count }, (_, page) => page);
  if (!onChange) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={nameOf(index + 1)}
        className={["flex-row items-center gap-1.5", className].filter(Boolean).join(" ")}
      >
        {pages.map((page) => (
          <PageIndicatorDot key={page} isCurrent={page === index} />
        ))}
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={label ?? t(K.pages)}
      className={["flex-row items-center", className].filter(Boolean).join(" ")}
    >
      {pages.map((page) => (
        <Pressable
          key={page}
          accessibilityRole="button"
          accessibilityLabel={nameOf(page + 1)}
          accessibilityState={{ selected: page === index }}
          onPress={() => onChange(page)}
          className="h-6 min-w-6 items-center justify-center"
        >
          <PageIndicatorDot isCurrent={page === index} />
        </Pressable>
      ))}
    </View>
  );
}
