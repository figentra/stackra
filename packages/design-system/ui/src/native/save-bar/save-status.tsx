/**
 * Stackra file contract:
 * Purpose: the native `SaveStatus`, the autosave indicator: `InlineLoading` with the autosave's words, `saving` drawn
 *          as loading, `saved` as success and `failed` as error, so its text cross-fades and is announced.
 * Boundary: no logic beyond the mapping and the default words from `ui::save_bar.*`. An autosave runs often, so it
 *           plays no haptic unless the caller passes `playsHaptics`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.3; design-system gap inventory
 *          row 8.
 */
import type { ReactElement } from "react";
import type { InlineLoadingStatus } from "#contracts/enums/inline-loading-status.enum";
import type { SaveState } from "#contracts/enums/save-state.enum";
import { SAVE_BAR_KEYS } from "#core/constants/save-bar-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { InlineLoading } from "#native/inline-loading/inline-loading";
import type { SaveStatusProps } from "#native/save-bar/save-status.props";

/** The inline loading state of each autosave state. */
const STATUS_OF = Object.freeze({
  idle: "idle",
  saving: "loading",
  saved: "success",
  failed: "error",
} as const satisfies Record<SaveState, InlineLoadingStatus>);

/** Where the autosave is: saving, saved or failed, announced as it changes. */
export function SaveStatus({
  state,
  savingLabel,
  savedLabel,
  failedLabel,
  playsHaptics = false,
  ...rest
}: SaveStatusProps): ReactElement {
  const t = useUiText();
  const keys = SAVE_BAR_KEYS.ui.save_bar;
  const status = STATUS_OF[state];
  return (
    <InlineLoading
      {...rest}
      status={status}
      playsHaptics={playsHaptics}
      {...(status === "loading" ? { loadingLabel: savingLabel ?? t(keys.saving) } : {})}
      {...(status === "success" ? { successLabel: savedLabel ?? t(keys.saved) } : {})}
      {...(status === "error" ? { errorLabel: failedLabel ?? t(keys.failed) } : {})}
    />
  );
}
