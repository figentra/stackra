/**
 * Stackra file contract:
 * Purpose: `capabilityConfig(catalogue, flags)`, what a build of a template line keeps and strips for a product's
 *          capability flags: the config plugins of the enabled flags, and the native modules, Info.plist keys,
 *          entitlements and Android permissions of every other flag, so the binary declares only what it uses. The
 *          advertising id (`AD_ID_PERMISSION`) is always blocked unless an enabled flag lists it.
 * Boundary: pure: the template's catalogue and the runway flags in, a `MobileCapabilityConfig` out. A declaration an
 *           enabled flag also lists is kept. Refuses a flag the template line does not offer.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 3 and enforcement: a flag the template does not offer is refused);
 *                     app-shells section 15 point 3; STA-1577 (AD_ID).
 */
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { AD_ID_PERMISSION } from "#node/constants/ad-id-permission.constant";
import type { ExpoPluginEntry } from "#node/types/expo-plugin-entry.type";
import type { MobileCapability } from "#node/types/mobile-capability.type";
import type { MobileCapabilityConfig } from "#node/types/mobile-capability-config.type";

/** The name of a plugin entry. */
function nameOf(plugin: ExpoPluginEntry): string {
  return typeof plugin === "string" ? plugin : plugin[0];
}

/** The entries of `pick` over the flags in `from`, each once, in catalogue order. */
function collect(
  from: readonly MobileCapability[],
  pick: (capability: MobileCapability) => readonly string[] | undefined,
): Set<string> {
  return new Set(from.flatMap((capability) => pick(capability) ?? []));
}

/**
 * The build-time config of `flags` on a template line.
 *
 * @param catalogue - the template line's `capabilities.json`: flag to what it switches on.
 * @param flags - the runway app's `capabilities`.
 * @param source - the runway path the flags came from, for the error.
 * @throws RunwayInvalidError naming every flag the catalogue does not offer.
 * @example
 * capabilityConfig(
 *   { scanner: { modules: ["expo-camera"], android: { permissions: ["android.permission.CAMERA"] } }, push: {} },
 *   ["push"],
 * ).blockedPermissions; // ["android.permission.CAMERA", "com.google.android.gms.permission.AD_ID"]
 */
export function capabilityConfig(
  catalogue: Readonly<Record<string, MobileCapability>>,
  flags: readonly string[],
  source = "capabilities",
): MobileCapabilityConfig {
  const unknown = flags.filter((flag) => !Object.hasOwn(catalogue, flag));
  if (unknown.length > 0) {
    throw new RunwayInvalidError(
      "runway.yaml",
      unknown.map((flag) => ({
        path: `${source}.${flags.indexOf(flag)}`,
        message: `The template line offers no capability ${flag}`,
      })),
    );
  }
  const on = Object.entries(catalogue)
    .filter(([flag]) => flags.includes(flag))
    .map(([, capability]) => capability);
  const off = Object.entries(catalogue)
    .filter(([flag]) => !flags.includes(flag))
    .map(([, capability]) => capability);
  const strip = (pick: (capability: MobileCapability) => readonly string[] | undefined) => {
    const kept = collect(on, pick);
    return [...collect(off, pick)].filter((entry) => !kept.has(entry));
  };
  const seen = new Set<string>();
  const plugins = on
    .flatMap((capability) => capability.plugins ?? [])
    .filter((plugin) => {
      const name = nameOf(plugin);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  return {
    plugins,
    removedPlugins: strip((capability) => capability.plugins?.map(nameOf)),
    excludedModules: strip((capability) => capability.modules),
    removedInfoPlist: strip((capability) => capability.ios?.infoPlist),
    removedEntitlements: strip((capability) => capability.ios?.entitlements),
    blockedPermissions: [
      ...new Set([
        ...strip((capability) => capability.android?.permissions),
        ...(collect(on, (capability) => capability.android?.permissions).has(AD_ID_PERMISSION)
          ? []
          : [AD_ID_PERMISSION]),
      ]),
    ],
  };
}
