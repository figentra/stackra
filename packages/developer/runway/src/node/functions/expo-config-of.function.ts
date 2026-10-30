/**
 * Stackra file contract:
 * Purpose: `expoConfigOf(base, input)`, the Expo app config of one product app (or one scope's white-label variant of
 *          it): the template line's base `expo` block with the runway identity (name, ids, scheme, app links, tablet),
 *          the runtime version from the template line, the EAS project and update URL, the config plugins of the
 *          enabled capabilities and their flags (`extra.capabilities`, which the app reads to wire its drivers),
 *          every disabled capability's plugins, Info.plist keys, entitlements and Android permissions taken out, and
 *          the Sign in with Apple entitlement when the app offers Apple.
 * Boundary: pure: data in, the `expo` block out; the job writes it. The slug is `<project>-<app>`, the slug of the
 *           app's EAS project. The first entry of `identity.name` is the store name; per-locale names are not written.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 2, 3, 6 and 8), ADR 0441 (decision 3), ADR 0180 (updates on the channel),
 *                     STA-1578 (App Store guideline 4.8).
 */
import type { ExpoPluginEntry } from "#node/types/expo-plugin-entry.type";
import type { MobileCapabilityConfig } from "#node/types/mobile-capability-config.type";
import type { MobileApp } from "#node/types/mobile-app.type";
import type { MobileVariant } from "#node/types/mobile-variant.type";

type Block = Record<string, unknown>;

/** `value` when it is an object, else an empty one. */
function blockOf(value: unknown): Block {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...(value as Block) }
    : {};
}

/** `block` without `keys`. */
function without(block: unknown, keys: readonly string[]): Block {
  return Object.fromEntries(Object.entries(blockOf(block)).filter(([key]) => !keys.includes(key)));
}

/** The name of a plugin entry. */
function nameOf(plugin: ExpoPluginEntry): string {
  return typeof plugin === "string" ? plugin : plugin[0];
}

/**
 * The Expo config of a product app.
 *
 * @param base - the template checkout's `app.json` `expo` block.
 * @param input.project - the root runway's `project`.
 * @param input.app - the app key under `mobile`.
 * @param input.entry - the runway app.
 * @param input.capabilities - `capabilityConfig` of the app's flags on the template line.
 * @param input.variant - the white-label variant, whose identity replaces the entry's key by key.
 * @example
 * expoConfigOf(template.expo, { project: "mezzora", app: "staff", entry, capabilities }).ios;
 * // { bundleIdentifier: "com.figentra.mezzora.staff", … }
 */
export function expoConfigOf(
  base: Readonly<Block>,
  input: {
    readonly project: string;
    readonly app: string;
    readonly entry: MobileApp;
    readonly capabilities: MobileCapabilityConfig;
    readonly variant?: MobileVariant | undefined;
  },
): Block {
  const { entry, capabilities, variant } = input;
  const identity = { ...entry.identity, ...variant?.identity };
  const links = identity.links ?? [];
  const name = Object.values(identity.name ?? {})[0];
  const projectId = entry.eas?.project;

  const ios = without(base["ios"], []);
  if (identity.ios?.bundleId !== undefined) ios["bundleIdentifier"] = identity.ios.bundleId;
  if (entry.tablet !== undefined) ios["supportsTablet"] = entry.tablet;
  if (links.length > 0) ios["associatedDomains"] = links.map((host) => `applinks:${host}`);
  ios["infoPlist"] = without(ios["infoPlist"], capabilities.removedInfoPlist);
  ios["entitlements"] = without(ios["entitlements"], capabilities.removedEntitlements);
  if (entry.signIn?.social.includes("apple") === true) {
    ios["usesAppleSignIn"] = true;
    (ios["entitlements"] as Block)["com.apple.developer.applesignin"] = ["Default"];
  }

  const android = without(base["android"], []);
  if (identity.android?.package !== undefined) android["package"] = identity.android.package;
  const blocked = Array.isArray(android["blockedPermissions"])
    ? (android["blockedPermissions"] as string[])
    : [];
  android["blockedPermissions"] = [...new Set([...blocked, ...capabilities.blockedPermissions])];
  if (links.length > 0) {
    android["intentFilters"] = [
      {
        action: "VIEW",
        autoVerify: true,
        data: links.map((host) => ({ scheme: "https", host })),
        category: ["BROWSABLE", "DEFAULT"],
      },
    ];
  }

  const basePlugins = (Array.isArray(base["plugins"]) ? base["plugins"] : []) as ExpoPluginEntry[];
  const plugins = [
    ...basePlugins.filter((plugin) => !capabilities.removedPlugins.includes(nameOf(plugin))),
    ...capabilities.plugins,
  ].filter(
    (plugin, index, all) => all.findIndex((other) => nameOf(other) === nameOf(plugin)) === index,
  );

  const extra = blockOf(base["extra"]);
  if (projectId !== undefined) extra["eas"] = { ...blockOf(extra["eas"]), projectId };
  // The template line's Sentry setup reads the public DSN from here (ADR 0062 decision 3, ADR 0482 decision 6).
  if (entry.sentry?.dsn !== undefined)
    extra["sentry"] = { ...blockOf(extra["sentry"]), dsn: entry.sentry.dsn };
  // The app wires a driver only for a flag it was built with: the other modules are not in the binary.
  extra["capabilities"] = [...(entry.capabilities ?? [])];

  return {
    ...base,
    ...(name === undefined ? {} : { name }),
    slug: `${input.project}-${input.app}`,
    ...(entry.eas?.owner === undefined ? {} : { owner: entry.eas.owner }),
    ...(identity.scheme === undefined ? {} : { scheme: identity.scheme }),
    // The template line is the native line: an update only reaches binaries built from the same line.
    runtimeVersion: entry.template.replaceAll(/[^A-Za-z0-9._+-]+/g, "-"),
    ...(projectId === undefined
      ? {}
      : { updates: { ...blockOf(base["updates"]), url: `https://u.expo.dev/${projectId}` } }),
    ios,
    android,
    plugins,
    extra,
  };
}
