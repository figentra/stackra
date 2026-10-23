/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CloseButton` takes: the standard dismiss control for overlays, banners and
 *          chips, with its accessible name required (HeroUI's web default is the English "Close" and its native
 *          one is none).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract); WCAG 2.2 SC 4.1.2.
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `CloseButton`. */
export interface CloseButtonContractProps {
  /** The accessible name in the app's language, for example "Close" or "Dismiss notification". */
  readonly label: string;
  /** An icon in place of HeroUI's close mark: an icon name or any icon element. */
  readonly icon?: IconSlot;
  /** True to refuse presses and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
  /** Called when the button is pressed, by pointer, touch or keyboard. */
  readonly onPress?: (() => void) | undefined;
}
