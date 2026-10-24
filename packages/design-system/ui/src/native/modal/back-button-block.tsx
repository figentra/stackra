/**
 * Stackra file contract:
 * Purpose: refuses the Android hardware back button while it is mounted with `isBlocked`: it registers a back handler
 *          that reports the press as handled, so the dialog stays open. It is how `isKeyboardDismissDisabled`, which
 *          has no Escape key on a phone, reaches native: back is the phone's Escape.
 * Boundary: renders nothing. HeroUI Native's Dialog registers its own back handler when its content mounts, and
 *           React Native calls the handlers last registered first; so this must be rendered after `Dialog.Content`,
 *           in the same portal, for its effect to run later than the dialog's own. iOS has no back button, so it does
 *           nothing there.
 * Runtime: react-native
 * Governing contract: ADR 0312 (decision 1 and Consequences); WCAG 2.2 SC 2.1.2 (no keyboard trap: the modal keeps
 *          its close control).
 */
import { useEffect } from "react";
import { BackHandler } from "react-native";

/** Props of BackButtonBlock. */
interface BackButtonBlockProps {
  /** True to swallow the hardware back button; false to leave it to the dialog. */
  readonly isBlocked: boolean;
}

/** Swallows the hardware back button while `isBlocked`; draws nothing. */
export function BackButtonBlock({ isBlocked }: BackButtonBlockProps): null {
  useEffect(() => {
    if (!isBlocked) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [isBlocked]);
  return null;
}
