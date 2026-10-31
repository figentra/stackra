/**
 * Stackra file contract:
 * Purpose: `ShortcutProvider`, the keyboard layer of the shortcut-aware UI: one window key listener feeding the
 *          registry of UI actions (`useShortcutAction`), the overlay stack (`ShortcutOverlayScope`), the hold-Mod reveal and
 *          the settings in force. `DesignSystemProvider` mounts it once.
 * Boundary: needs no container (unlike `ShortcutBindings`, which binds the `Shortcut` classes); both may run side by
 *           side. Listens in the capture phase so a page shortcut answers before a focused widget swallows the key;
 *           the typing guard keeps plain keys for text fields. Clears the reveal and any pending sequence on blur.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import {
  type ReactElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { DEFAULT_SHORTCUT_SETTINGS } from "#core/constants/default-shortcut-settings.constant";
import { isApplePlatform } from "#core/functions/is-apple-platform.function";
import type { ShortcutSettings } from "#core/types/shortcut-settings.type";
import { createShortcutRegistry } from "#react/shortcut-provider/create-shortcut-registry.function";
import type { ShortcutProviderProps } from "#react/shortcut-provider/shortcut-provider.props";
import type { ShortcutProviderValue } from "#react/shortcut-provider/shortcut-provider-value.type";
import { ShortcutRegistryContext } from "#react/shortcut-provider/shortcut-registry-context";

/** The platform never changes while the page lives. */
const subscribe = () => () => undefined;

/** The server snapshot: no navigator, so the non-Apple form. */
const onServer = () => false;

/** Every permission, when the host gives no check. */
const allowAll = () => true;

/**
 * Listens for the registered actions' keys while mounted.
 *
 * @example
 * <ShortcutProvider settings={settings} onSettingsChange={save} direction="rtl">
 *   <App />
 * </ShortcutProvider>
 */
export function ShortcutProvider({
  children,
  settings: controlled,
  defaultSettings,
  onSettingsChange,
  direction = "ltr",
  can,
}: ShortcutProviderProps): ReactElement {
  const apple = useSyncExternalStore(subscribe, isApplePlatform, onServer);
  const [own, setOwn] = useState<ShortcutSettings>(defaultSettings ?? DEFAULT_SHORTCUT_SETTINGS);
  const settings = controlled ?? own;
  const rtl = direction === "rtl";
  const live = useRef({ settings, apple, rtl, can: can ?? allowAll });
  const change = useRef(onSettingsChange);
  // Layout effect: the registry reads the props of the last commit at key time, never a render in progress.
  useLayoutEffect(() => {
    live.current = { settings, apple, rtl, can: can ?? allowAll };
    change.current = onSettingsChange;
  });
  // oxlint-disable-next-line react/refs -- reason: the ref is read at key time inside the registry, never during render
  const [registry] = useState(() => createShortcutRegistry(() => live.current));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      registry.keyDown(event, event.timeStamp || Date.now());
    };
    const onKeyUp = (event: KeyboardEvent) => registry.keyUp(event.key);
    const onBlur = () => registry.reset();
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [registry]);

  const value = useMemo<ShortcutProviderValue>(
    () => ({
      registry,
      settings,
      apple,
      rtl,
      isMounted: true,
      setSettings: (next) => {
        setOwn(next);
        change.current?.(next);
      },
    }),
    [registry, settings, apple, rtl],
  );
  return <ShortcutRegistryContext value={value}>{children}</ShortcutRegistryContext>;
}
