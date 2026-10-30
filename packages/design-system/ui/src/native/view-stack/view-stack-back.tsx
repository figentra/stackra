/**
 * Stackra file contract:
 * Purpose: the native `ViewStack.Back`: a ghost button with a back chevron that goes back one view; drawn only when
 *          there is a view to go back to.
 * Boundary: the chevron is the `Icon` set's `chevron-left`, mirrored in right-to-left because it points the reading
 *           way back. The visible label is the caller's, in the app's language.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import type { ReactElement } from "react";

import { Button } from "#native/button/button";
import { Icon } from "#native/icon/icon";
import { useViewStack } from "#native/view-stack/use-view-stack";
import type { ViewStackBackProps } from "#native/view-stack/view-stack-back.props";

/** The back chevron, mirrored in right-to-left. */
const BACK_ICON = <Icon name="chevron-left" />;

/** Goes back one view. */
export function ViewStackBack({ children }: ViewStackBackProps): ReactElement | null {
  const { canGoBack, pop } = useViewStack();
  if (!canGoBack) return null;
  return (
    <Button variant="ghost" startIcon={BACK_ICON} onPress={pop}>
      {children}
    </Button>
  );
}
