/**
 * Stackra file contract:
 * Purpose: the web `UndoLabel`, the undo toast's button word in the reader's language ("Undo", "تراجع"), read when the
 *          toast renders, since `toast.undo` runs outside React and cannot read the catalogue itself.
 * Boundary: internal, not in the `react` barrel.
 * Runtime: browser
 * Governing contract: ADR 0080; ADR 0403; STA-1371.
 */
import type { ReactElement } from "react";

import { TOAST_KEYS } from "#core/constants/toast-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** "Undo" in the reader's language. */
export function UndoLabel(): ReactElement {
  const t = useUiText();
  return <>{t(TOAST_KEYS.ui.toast.undo)}</>;
}
