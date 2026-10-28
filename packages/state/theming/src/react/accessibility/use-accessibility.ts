/**
 * Stackra file contract:
 * Purpose: `useAccessibility()`, the hook code that animates in JavaScript, lays out dense screens or draws its own
 *          text reads the system's accessibility settings with (reduce motion, bold text, high contrast, font scale),
 *          re-rendering when one changes.
 * Boundary: reads the `SystemAccessibility` driver of the nearest container through `useSyncExternalStore`. A server
 *           render and a hydrating client read `DEFAULT_ACCESSIBILITY_SETTINGS`, so hydration never mismatches. There is
 *           no setter: the app follows the system and never overrides it (owner decision 2026-10-29). Touches no
 *           platform API, so the same hook serves the web and native runtimes. Throws outside a `ContainerProvider` or
 *           when the container binds no `SystemAccessibility` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0079 (client state); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import { useMemo, useSyncExternalStore } from "react";

import { DEFAULT_ACCESSIBILITY_SETTINGS, SystemAccessibility } from "#contracts/index";
import type { AccessibilitySettings } from "#contracts/index";

/** What a server render shows. */
const serverSnapshot = (): AccessibilitySettings => DEFAULT_ACCESSIBILITY_SETTINGS;

/**
 * The system's accessibility settings.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `SystemAccessibility`.
 * @example
 * const { reduceMotion } = useAccessibility();
 * const duration = reduceMotion ? 0 : 240;
 */
export function useAccessibility(): AccessibilitySettings {
  const system = useContainer().get(SystemAccessibility);
  // The driver's methods are prototype methods; bound once so the store sees stable functions.
  const [subscribe, read] = useMemo(
    () => [system.subscribe.bind(system), system.current.bind(system)] as const,
    [system],
  );
  return useSyncExternalStore(subscribe, read, serverSnapshot);
}
