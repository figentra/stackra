/**
 * Stackra file contract:
 * Purpose: `enterKioskOnLaunch(kiosk, config, deviceSetting?)`, the launch step of a kiosk: enters the operating
 *          system's kiosk lock when the device's setting (or, without one, the config's `enterOnLaunch`: a
 *          `KioskConfig`, or `{ enterOnLaunch: desktop.kioskOnLaunch }` on Electron) asks for it, and answers what
 *          happened.
 * Boundary: one decision and one port call, made once after boot by the target's `createApp` (`@stackra/app`). A
 *           target that cannot lock (no driver, a refused probe) answers the refusal instead of throwing, so a till
 *           still starts; a lock already on is left as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 2); ADR 0281 (kiosk mode); ADR 0344 (the kiosk launch mode is tier now).
 */
import type { KioskMode } from "#contracts/ports/kiosk-mode.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * Enters kiosk mode on launch when asked to.
 *
 * @example
 * await enterKioskOnLaunch(container.get(KioskMode), container.get(KioskConfig), device.settings.kiosk);
 *
 * @returns the probe's refusal or `enter()`'s result when the device should be a kiosk, else `undefined`.
 */
export async function enterKioskOnLaunch(
  kiosk: KioskMode,
  config: { readonly enterOnLaunch: boolean },
  deviceSetting?: boolean,
): Promise<CapabilityResult | undefined> {
  if (!(deviceSetting ?? config.enterOnLaunch)) return undefined;
  const probe = await kiosk.probe();
  if (!probe.ok) return probe;
  if (await kiosk.isActive()) return probe;
  return kiosk.enter();
}
