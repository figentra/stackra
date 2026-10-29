/**
 * Stackra file contract:
 * Purpose: `AppLockGate`, the opt-in app lock the native app mounts around its content (STA-1537): it locks on
 *          launch and after `lockAfter` in the background, asks `AppLock` (biometrics, the passcode as fallback), and
 *          covers the app whenever it leaves the foreground so the app switcher shows no content.
 * Boundary: reads `AppLockConfig` and `AppLock` from the nearest container; renders only its children when the lock is
 *           off for the role, and unlocks at once when the phone cannot authenticate (no lock without a way out). The children
 *           stay mounted under the cover and are hidden from screen readers while it shows. A role that turns the
 *           lock on mid-session locks at the next return from the background.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0478 (no hand-written native code).
 */
import { Duration } from "@stackra/contracts";
import { useContainer } from "@stackra/container/react";
import type { ReactNode } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { AppLockConfig } from "#config/app-lock.config";
import { AppLock } from "#contracts/ports/app-lock.port";
import { appLockPolicy } from "#core/functions/app-lock-policy.function";
import type { AppLockGateProps } from "#native/types/app-lock-gate-props.type";

/**
 * Guards the app with the app lock.
 *
 * @example
 * <AppLockGate roleName={session.role} reason={t("platform::app_lock.reason")} unlockLabel={t("platform::app_lock.unlock")}
 *   coverColor={background} textColor={foreground}>
 *   <Navigation />
 * </AppLockGate>
 */
export function AppLockGate({
  roleName,
  reason,
  unlockLabel,
  coverColor,
  textColor,
  children,
}: AppLockGateProps): ReactNode {
  const container = useContainer();
  const config = container.get(AppLockConfig);
  const { isEnabled, lockAfter } = appLockPolicy(config, roleName);
  const { allowPasscode } = config;
  const [isLocked, setLocked] = useState(isEnabled);
  const [isAway, setAway] = useState(AppState.currentState !== "active");
  const leftAt = useRef<number | null>(null);
  const [isPromptDue, setPromptDue] = useState(isEnabled);
  // The OS prompt turns the app inactive and back; this keeps that round trip from prompting twice.
  const prompting = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        setAway(true);
        // The OS prompt itself makes the app inactive on iOS; only a real trip to the background starts the clock.
        if (state === "background") leftAt.current ??= Date.now();
        return;
      }
      setAway(false);
      const away = leftAt.current === null ? 0 : Date.now() - leftAt.current;
      if (leftAt.current !== null && isEnabled && away >= Duration.toMilliseconds(lockAfter)) {
        setLocked(true);
        setPromptDue(true);
      }
      leftAt.current = null;
    });
    return () => subscription.remove();
  }, [isEnabled, lockAfter]);

  // Asks the phone with the latest reason and lock; an effect event, so neither re-runs the effect below.
  const prompt = useEffectEvent(async () => {
    prompting.current = true;
    try {
      const lock = container.get(AppLock);
      const canAuthenticate = await lock.canAuthenticate(allowPasscode);
      if (!canAuthenticate || (await lock.authenticate(reason, allowPasscode))) setLocked(false);
    } finally {
      prompting.current = false;
      setPromptDue(false);
    }
  });

  // Prompts once per lock, or per press of the unlock button, while the app is on screen.
  useEffect(() => {
    if (isPromptDue && !isAway && !prompting.current) void prompt();
  }, [isPromptDue, isAway]);

  const isCovered = isLocked || (isEnabled && isAway);
  return (
    <View style={styles.fill}>
      <View
        style={styles.fill}
        accessibilityElementsHidden={isCovered}
        importantForAccessibility={isCovered ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {isCovered ? (
        <View
          testID="app-lock-cover"
          style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: coverColor }]}
        >
          {isLocked && !isAway ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPromptDue(true)}
              style={styles.button}
            >
              <Text style={{ color: textColor }}>{unlockLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** The gate's layout: the app fills the screen and the cover centres its button. */
const styles = StyleSheet.create({
  fill: { flex: 1 },
  cover: { alignItems: "center", justifyContent: "center" },
  button: { minHeight: 44, minWidth: 44, padding: 12, justifyContent: "center" },
});
