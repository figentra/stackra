/**
 * Stackra file contract:
 * Purpose: the web `KioskSurface`: the accessible unattended mode of a screen (a self-service kiosk, a lane, a gate
 *          screen). It resets after the idle timeout with no pointer, touch or key; lays the screen out for the reach
 *          chosen (`seated` keeps every control in the lower band, with larger targets); turns on high contrast; and
 *          speaks announcements when audio is on, through the browser's speech synthesis in the provider's locale
 *          unless the caller passes `speak`. Every announcement also lands in a polite live region.
 * Boundary: presentation and input only. Entering the operating system's kiosk lock is `@stackra/platform`'s
 *           `KioskMode`; what a reset does is the caller's `onIdle`. High contrast sets `data-contrast="more"` on the
 *           surface with the stronger material edge the theme uses for `prefers-contrast: more`, so a kiosk gets it
 *           without the visitor's own setting. The timeout and the defaults are device settings (ADR 0428).
 * Runtime: browser
 * Governing contract: ADR 0428 (decision 1); R3-SO-10; WCAG 2.2 SC 1.4.6, 2.2.1, 2.5.8 and 4.1.3.
 */
import {
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";

import type { KioskState } from "#contracts/types/kiosk-state.type";
import { idleTimer } from "#core/functions/idle-timer.function";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { KioskContext } from "#react/kiosk-surface/kiosk-context";
import type { KioskSurfaceProps } from "#react/kiosk-surface/kiosk-surface.props";

/** The input that counts as someone at the kiosk. */
const ACTIVITY = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/** The theme's stronger material edge, as its `prefers-contrast: more` rule sets it. */
const HIGH_CONTRAST_STYLE = Object.freeze({ "--material-edge-share": "0.45" } as CSSProperties);

/**
 * A screen in kiosk mode.
 *
 * @example
 * <KioskSurface idleTimeoutMs={settings.kiosk.idleTimeoutMs} onIdle={reset} reach="seated" isAudioOn>
 *   <SelfCheckout />
 * </KioskSurface>
 */
export function KioskSurface({
  children,
  idleTimeoutMs,
  onIdle,
  reach = "standing",
  isHighContrast = false,
  isAudioOn = false,
  speak,
}: KioskSurfaceProps): ReactElement {
  const locale = use(DesignSystemContext)?.locale;
  const [announcement, setAnnouncement] = useState("");
  const latestOnIdle = useRef(onIdle);
  // oxlint-disable-next-line react/refs -- reason: the idle timer reads the latest callback; the ref is never read to render
  latestOnIdle.current = onIdle;
  const timer = useRef<ReturnType<typeof idleTimer> | null>(null);

  useEffect(() => {
    const running = idleTimer(idleTimeoutMs, () => latestOnIdle.current());
    timer.current = running;
    for (const name of ACTIVITY) window.addEventListener(name, running.touch, { passive: true });
    return () => {
      for (const name of ACTIVITY) window.removeEventListener(name, running.touch);
      running.stop();
      timer.current = null;
    };
  }, [idleTimeoutMs]);

  const state = useMemo<KioskState>(() => {
    const say =
      speak ??
      ((text: string) => {
        if (typeof speechSynthesis === "undefined") return;
        const utterance = new SpeechSynthesisUtterance(text);
        if (locale !== undefined) utterance.lang = locale;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      });
    return {
      reach,
      isHighContrast,
      isAudioOn,
      announce: (text) => {
        setAnnouncement(text);
        if (isAudioOn) say(text);
      },
      resetIdle: () => timer.current?.touch(),
    };
  }, [reach, isHighContrast, isAudioOn, speak, locale]);

  return (
    <KioskContext value={state}>
      <div
        data-slot="kiosk-surface"
        data-reach={reach}
        data-contrast={isHighContrast ? "more" : undefined}
        style={isHighContrast ? HIGH_CONTRAST_STYLE : undefined}
        className={
          reach === "seated"
            ? "flex min-h-dvh flex-col justify-end text-lg [&_button]:min-h-14"
            : "flex min-h-dvh flex-col"
        }
      >
        <div className={reach === "seated" ? "max-h-[70dvh] overflow-y-auto" : "flex-1"}>
          {children}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </KioskContext>
  );
}
