/**
 * Stackra file contract:
 * Purpose: the web `FullscreenBar`: the title, actions and exit of a full-screen mode, pinned to the top. It slides
 *          away after `autoHideMs` without activity and comes back on a pointer move, a tap at the top edge or any
 *          key; when `isLocked`, a pointer brings it back only with a long press at the top edge (the manager
 *          gesture).
 * Boundary: the slide is a CSS transform on the theme's base duration and stops under `prefers-reduced-motion`
 *           (the bar then simply appears and disappears). A hidden bar is `inert` and hidden from assistive
 *           technology; it never hides while it holds focus or the pointer (WCAG 2.2 SC 2.2.1). Leaving the
 *           platform's full screen is the caller's `onExit`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5: adapted form); GAPS.md row 32 (owner decision 2026-10-28); WCAG
 *          2.2 SC 2.1.1 and 2.2.1.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef } from "react";

import { FULLSCREEN_BAR_KEYS } from "#core/constants/fullscreen-bar-keys.constant";
import { FULLSCREEN_BAR_LONG_PRESS_MS } from "#core/constants/fullscreen-bar-long-press-ms.constant";
import { FULLSCREEN_BAR_ICONS } from "#react/fullscreen-bar/fullscreen-bar-icons.constant";
import { useAutoHide } from "#react/hooks/use-auto-hide";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { Text } from "#react/text/text";
import type { FullscreenBarProps } from "#react/fullscreen-bar/fullscreen-bar.props";

/** The bar's words. */
const K = FULLSCREEN_BAR_KEYS.ui.fullscreen_bar;

/** The slide's duration. */
const SLIDE = motionTiming(STACKRA_THEME, "base");

/** The exit and title bar of a full-screen mode, hiding itself after a quiet spell. */
export function FullscreenBar({
  title,
  actions,
  onExit,
  exitLabel,
  autoHideMs = 4000,
  isLocked = false,
  className,
  style,
  ...rest
}: FullscreenBarProps): ReactElement {
  const t = useUiText();
  const { isVisible, show, hold } = useAutoHide(autoHideMs);
  const press = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Any key brings the bar back (a keyboard is staff-only); a pointer move does unless the screen is locked.
  useEffect(() => {
    window.addEventListener("keydown", show);
    if (!isLocked) window.addEventListener("pointermove", show);
    return () => {
      window.removeEventListener("keydown", show);
      window.removeEventListener("pointermove", show);
      clearTimeout(press.current);
    };
  }, [show, isLocked]);

  const startPress = () => {
    if (!isLocked) return show();
    clearTimeout(press.current);
    press.current = setTimeout(show, FULLSCREEN_BAR_LONG_PRESS_MS);
  };
  const endPress = () => clearTimeout(press.current);

  return (
    <>
      {isVisible ? null : (
        <div
          data-slot="fullscreen-bar-reveal"
          aria-hidden
          className="fixed inset-x-0 top-0 z-50 h-6"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
        />
      )}
      <header
        {...rest}
        data-slot="fullscreen-bar"
        data-visible={isVisible}
        inert={!isVisible}
        aria-hidden={!isVisible}
        onPointerEnter={() => hold(true)}
        onPointerLeave={() => hold(false)}
        onFocus={() => hold(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) hold(false);
        }}
        style={{ ...style, transitionDuration: `${SLIDE.durationMs}ms` }}
        className={
          cn(
            "fixed inset-x-0 top-0 z-50 flex items-center gap-3 border-b border-separator bg-surface px-4 py-2 text-foreground transition-transform ease-out motion-reduce:transition-none",
            isVisible ? "translate-y-0" : "-translate-y-full",
            className,
          ) ?? ""
        }
      >
        <Text className="min-w-0 flex-1 truncate font-medium">{title}</Text>
        {actions}
        <IconButton
          variant="ghost"
          label={exitLabel ?? t(K.exit)}
          onPress={onExit}
          icon={
            <IconRegistryProvider registry={FULLSCREEN_BAR_ICONS}>
              <Icon name="minimize-2" />
            </IconRegistryProvider>
          }
        />
      </header>
    </>
  );
}
