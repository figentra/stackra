/**
 * Stackra file contract:
 * Purpose: one native `ViewStack.View`: a view drawn only while it is the top of its stack.
 * Boundary: once the stack has moved, the view that appears announces its `label` to VoiceOver and TalkBack, so a
 *           screen-reader user hears where they are.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.4.3 and 4.1.3.
 */
import { type ReactElement, use, useEffect } from "react";
import { AccessibilityInfo, View } from "react-native";

import { ViewStackContext } from "#native/view-stack/view-stack-context";
import type { ViewStackViewProps } from "#native/view-stack/view-stack-view.props";

/** One view of a stack. */
export function ViewStackView({ id, label, children }: ViewStackViewProps): ReactElement | null {
  const value = use(ViewStackContext);
  const isShown = value?.state.current === id;
  const hasMoved = value?.hasMoved ?? false;
  useEffect(() => {
    if (isShown && hasMoved) AccessibilityInfo.announceForAccessibility(label);
  }, [isShown, hasMoved, label]);
  if (!isShown) return null;
  return <View accessibilityLabel={label}>{children}</View>;
}
