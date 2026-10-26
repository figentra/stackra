/**
 * Stackra file contract:
 * Purpose: the native `KioskSurface`: the accessible unattended mode of a tablet kiosk or lane screen. It resets after
 *          the idle timeout with no touch; lays the screen out for the reach chosen (`seated` keeps every control in
 *          the lower band); carries high contrast to the components through `useKiosk()`; and speaks announcements
 *          through the caller's `speak` when audio is on, besides the screen reader's own announcement.
 * Boundary: presentation and input only. Touches are observed in the capture phase and never claimed, so every
 *           control still gets its touch. Locking the tablet to the app is `@stackra/platform`'s `KioskMode`; what a
 *           reset does is the caller's `onIdle`; React Native has no speech of its own, so audio needs `speak`.
 * Runtime: react-native
 * Governing contract: ADR 0428 (decision 1); R3-SO-10; WCAG 2.2 SC 2.2.1, 2.5.8 and 4.1.3.
 */
import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { AccessibilityInfo, View } from "react-native";

import type { KioskSurfaceContractProps } from "#contracts/types/kiosk-surface-contract-props.type";
import type { KioskState } from "#contracts/types/kiosk-state.type";
import { idleTimer } from "#core/functions/idle-timer.function";
import { KioskContext } from "#native/kiosk-surface/kiosk-context";

/** Props of the native KioskSurface. */
export type KioskSurfaceProps = KioskSurfaceContractProps;

/**
 * A screen in kiosk mode.
 *
 * @example
 * <KioskSurface idleTimeoutMs={settings.kiosk.idleTimeoutMs} onIdle={reset} reach="seated" isAudioOn speak={speech.say}>
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
  const latestOnIdle = useRef(onIdle);
  // oxlint-disable-next-line react/refs -- reason: the idle timer reads the latest callback; the ref is never read to render
  latestOnIdle.current = onIdle;
  const timer = useRef<ReturnType<typeof idleTimer> | null>(null);

  useEffect(() => {
    const running = idleTimer(idleTimeoutMs, () => latestOnIdle.current());
    timer.current = running;
    return () => {
      running.stop();
      timer.current = null;
    };
  }, [idleTimeoutMs]);

  const state = useMemo<KioskState>(
    () => ({
      reach,
      isHighContrast,
      isAudioOn,
      announce: (text) => {
        AccessibilityInfo.announceForAccessibility(text);
        if (isAudioOn) speak?.(text);
      },
      resetIdle: () => timer.current?.touch(),
    }),
    [reach, isHighContrast, isAudioOn, speak],
  );

  return (
    <KioskContext value={state}>
      <View
        testID="kiosk-surface"
        // Observes every touch for the idle countdown and never becomes the responder.
        onStartShouldSetResponderCapture={() => {
          timer.current?.touch();
          return false;
        }}
        className={reach === "seated" ? "flex-1 justify-end" : "flex-1"}
      >
        <View className={reach === "seated" ? "max-h-[70%]" : "flex-1"}>{children}</View>
      </View>
    </KioskContext>
  );
}
