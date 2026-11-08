/**
 * Stackra file contract:
 * Purpose: `systemDriverDefaults`, the follow-the-system ports a host's wiring binds whether or not a constructor
 *          injects them (a hook such as `useAccessibility()` resolves `SystemAccessibility` from the container), with the
 *          driver each one takes on the host's runtime: on an Expo app (iOS and Android only) `SystemAccessibility`
 *          takes `accessibility_info` and `SystemSettings` takes `expo`; `SystemPermissions` takes the app's own driver
 *          (the abstract `ExpoSystemPermissionsDriver` is never a candidate, so the app subclasses it) or `memory`; on
 *          the web, the desktop renderer and in a service or worker each takes `memory` (STA-1535, STA-1536). The
 *          phone ports `AppLock`, `Passkeys`, `LiveActivities`, `DeviceSearchIndex`, `IncomingShare` and `AppIcon` take
 *          `expo` on an Expo app, each with the config class its drivers read. A service that declares
 *          `@stackra/identity` binds the actions pipeline's `StepUpCheck` to identity's `identity` driver (STA-340), and one
 *          that declares `@stackra/app` binds `JsonWebKeys` to its `oidc` driver with `BearerConfig`, the generated
 *          auth handler's key source (STA-2558). One that declares `@stackra/app`, `@stackra/clients` and
 *          `@stackra/identity` binds `ClientSession` to app's `service` driver and `ServiceTokens` to identity's `zitadel`
 *          driver with `ServiceTokensConfig`, so its generated clients send its own token with no host wiring.
 * Boundary: pure. A package's own wiring is left to its test default; a host that does not declare the port's package
 *           gets none. One wiring serves every runtime of an app, so an app with both a browser and a native target
 *           takes `memory` in its wiring and asks for the `native` rows again for its native entry's `nativeWiring`.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0266 (memory first); ADR 0302 (2026-10-29 note: a native
 *                     app follows the system).
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { driverName } from "#core/functions/driver-name.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { SystemDriverDefault } from "#core/types/system-driver-default.type";

/** One follow-the-system port: its package, port class, Expo driver (none: the app's own) and config class. */
interface SystemPort {
  readonly package: string;
  readonly port: ClassRef;
  readonly native?: string;
  readonly config?: ClassRef;
  /** A service's driver (by name), for a port only a service binds; such a port is never an app's. */
  readonly server?: string;

  /** The other packages the host must declare too, so the wiring never imports one it does not. */
  readonly requires?: readonly string[];
}

/** A phone port of `pkg` whose Expo driver is `expo`, with the config class its drivers read. */
const phone = (pkg: string, port: string, config?: string): SystemPort => ({
  package: pkg,
  port: { name: port, from: `${pkg}/contracts` },
  native: "expo",
  ...(config === undefined ? {} : { config: { name: config, from: pkg } }),
});

/** The follow-the-system ports, in the order the wiring lists them. */
const SYSTEM_PORTS: readonly SystemPort[] = [
  {
    package: "@stackra/theming",
    port: { name: "SystemAccessibility", from: "@stackra/theming/contracts" },
    native: "accessibility_info",
  },
  {
    package: "@stackra/platform",
    port: { name: "SystemSettings", from: "@stackra/platform/contracts" },
    native: "expo",
  },
  {
    package: "@stackra/platform",
    port: { name: "SystemPermissions", from: "@stackra/platform/contracts" },
  },
  phone("@stackra/platform", "AppLock", "AppLockConfig"),
  phone("@stackra/identity", "Passkeys"),
  phone("@stackra/platform", "LiveActivities", "LiveActivityConfig"),
  phone("@stackra/native-spotlight", "DeviceSearchIndex", "SpotlightConfig"),
  phone("@stackra/native-share", "IncomingShare", "NativeShareConfig"),
  phone("@stackra/platform", "AppIcon", "AppIconConfig"),
  // The pipeline's step-up check: identity's driver in any service that declares it, so an action with `stepUp`
  // does not fail closed there by accident; a host without identity binds none (ADR 0406 decision 4, STA-340).
  {
    package: "@stackra/identity",
    port: { name: "StepUpCheck", from: "@stackra/actions/contracts" },
    server: "identity",
  },
  // The generated auth handler's keys: the issuer's JWKS (`oidc`, read through `BearerConfig`) in any service that
  // declares @stackra/app, so `CallAuthenticator` resolves with no host configuration (STA-2558).
  {
    package: "@stackra/app",
    port: { name: "JsonWebKeys", from: "@stackra/app/contracts" },
    config: { name: "BearerConfig", from: "@stackra/app/server" },
    server: "oidc",
  },
  // A service's generated clients send its own token, and the user's it may forward, through app's `service` session;
  // the token comes from its ZITADEL service account (`zitadel`, read through `ServiceTokensConfig`). Both need all three
  // packages declared, since the wiring imports each (ADR 0209 A8, STA-2558).
  {
    package: "@stackra/app",
    requires: ["@stackra/clients", "@stackra/identity"],
    port: { name: "ClientSession", from: "@stackra/clients/contracts" },
    server: "service",
  },
  {
    package: "@stackra/identity",
    requires: ["@stackra/app", "@stackra/clients"],
    port: { name: "ServiceTokens", from: "@stackra/identity/contracts" },
    config: { name: "ServiceTokensConfig", from: "@stackra/identity/node" },
    server: "zitadel",
  },
];

/**
 * The follow-the-system ports of `ir` with the driver each takes.
 *
 * @param ir - the member read by discovery.
 * @param runtime - the runtime the rows are for; the wiring's when absent (`native` only for an Expo-only app).
 * @example
 * systemDriverDefaults({ ...appIr, targets: ["ios", "android"] });
 * // [{ port: SystemAccessibility, driver: "accessibility_info" }, { port: SystemSettings, driver: "expo" }, ...]
 * systemDriverDefaults({ ...appIr, targets: ["web", "ios"] }, "native"); // the native entry's rows
 */
export function systemDriverDefaults(
  ir: MemberIR,
  runtime?: "browser" | "native",
): SystemDriverDefault[] {
  if (ir.layout === "package") return [];
  const declares = (name: string): boolean =>
    (ir.packages ?? []).includes(name) ||
    ir.dependencies.some((dependency) => dependency.package === name);
  const runtimes = clientRuntimes(ir);
  const native =
    runtime === undefined
      ? runtimes.length === 1 && runtimes[0] === "native"
      : runtime === "native" && runtimes.includes("native");
  const service = ir.layout === "service";
  return SYSTEM_PORTS.filter(
    (entry) =>
      declares(entry.package) &&
      (entry.requires ?? []).every(declares) &&
      (entry.server === undefined || service),
  ).map((entry) => {
    const { port, native: driver } = entry;
    const config = entry.config === undefined ? {} : { config: entry.config };
    if (entry.server !== undefined) return { port, driver: entry.server, ...config };
    if (!native) return { port, driver: "memory", ...config };
    if (driver !== undefined) return { port, driver, ...config };
    const own = ir.classes.filter(
      (declared) =>
        declared.kind === "driver" &&
        declared.abstract !== true &&
        declared.partner?.name === port.name,
    );
    const only = own.length === 1 ? own[0] : undefined;
    return {
      port,
      driver: only === undefined ? "memory" : driverName(only.file, port.name),
      ...config,
    };
  });
}
