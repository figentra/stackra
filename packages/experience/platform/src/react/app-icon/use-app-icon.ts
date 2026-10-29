/**
 * Stackra file contract:
 * Purpose: `useAppIcon()`, the hook a settings screen or a brand, season or tenant switch changes the home-screen icon
 *          with; `null` on a target that binds no `AppIcon`, so the picker is not rendered.
 * Boundary: re-renders when the icon changes. `set` refuses (`unavailable`) a name `AppIconConfig.icons` does not
 *           list before it reaches the device, since a tenant setting may name an icon this build lacks; without the
 *           configuration the build carries no alternate icons.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0294 (decision 17).
 */
import { useContainer } from "@stackra/container/react";
import { useSignal } from "@stackra/state/react";

import { AppIconConfig } from "#config/app-icon.config";
import { AppIcon } from "#contracts/ports/app-icon.port";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { liveValue } from "#core/functions/live-value.function";
import { refuse } from "#core/functions/refuse.function";
import type { AppIconState } from "#react/app-icon/app-icon-state.type";

/** The default icon, read when no `AppIcon` is bound, so the hook order stays fixed. */
const DEFAULT_ICON = liveValue<string | null>(null);

/**
 * The app icon, or `null` without one.
 *
 * @example
 * const appIcon = useAppIcon();
 * const shown = await appIcon?.set(tenant.appIcon ?? null); // null shows the default icon
 */
export function useAppIcon(): AppIconState | null {
  const container = useContainer();
  const appIcon = container.has(AppIcon) ? container.get(AppIcon) : null;
  const icons = container.has(AppIconConfig) ? container.get(AppIconConfig).icons : [];
  const icon = useSignal(appIcon?.current ?? DEFAULT_ICON);

  if (appIcon === null) return null;
  return {
    icon,
    icons,
    isSupported: appIcon.isSupported,
    set: async (name) =>
      name === null || icons.includes(name)
        ? appIcon.set(name)
        : refuse(PlatformCapability.AppIcon, "unavailable"),
  };
}
