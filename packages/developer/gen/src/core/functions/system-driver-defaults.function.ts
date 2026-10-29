/**
 * Stackra file contract:
 * Purpose: `systemDriverDefaults`, the follow-the-system ports a host's wiring binds whether or not a constructor
 *          injects them (a hook such as `useAccessibility()` resolves `SystemAccessibility` from the container), with the
 *          driver each one takes on the host's runtime: on an Expo app (iOS and Android only) `SystemAccessibility`
 *          takes `accessibility_info` and `SystemSettings` takes `expo`; `DevicePermissions` takes the app's own driver
 *          (the abstract `ExpoDevicePermissionsDriver` is never a candidate, so the app subclasses it) or `memory`; on
 *          the web, the desktop renderer and in a service or worker each takes `memory` (STA-1535, STA-1536).
 * Boundary: pure. A package's own wiring is left to its test default; a host that does not declare the port's package
 *           gets none. One wiring serves every runtime of an app, so an app with both a browser and a native target
 *           takes `memory` everywhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (gen writes the wiring); ADR 0266 (memory first); ADR 0302 (2026-10-29 note: a native
 *                     app follows the system).
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { driverName } from "#core/functions/driver-name.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { SystemDriverDefault } from "#core/types/system-driver-default.type";

/** One follow-the-system port: its package, the port class and the driver an Expo app takes (none: the app's own). */
interface SystemPort {
  readonly package: string;
  readonly port: ClassRef;
  readonly native?: string;
}

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
    port: { name: "DevicePermissions", from: "@stackra/platform/contracts" },
  },
];

/**
 * The follow-the-system ports of `ir` with the driver each takes.
 *
 * @param ir - the member read by discovery.
 * @example
 * systemDriverDefaults({ ...appIr, targets: ["ios", "android"] });
 * // [{ port: SystemAccessibility, driver: "accessibility_info" }, { port: SystemSettings, driver: "expo" }, ...]
 */
export function systemDriverDefaults(ir: MemberIR): SystemDriverDefault[] {
  if (ir.layout === "package") return [];
  const declares = (name: string): boolean =>
    (ir.packages ?? []).includes(name) ||
    ir.dependencies.some((dependency) => dependency.package === name);
  const runtimes = clientRuntimes(ir);
  // shortcut: one wiring serves both runtimes, so an app with web and native targets takes memory on both; give the
  // native entry its own driver defaults when such an app ships.
  const native = runtimes.length === 1 && runtimes[0] === "native";
  return SYSTEM_PORTS.filter((entry) => declares(entry.package)).map(({ port, native: driver }) => {
    if (!native) return { port, driver: "memory" };
    if (driver !== undefined) return { port, driver };
    const own = ir.classes.filter(
      (declared) =>
        declared.kind === "driver" &&
        declared.abstract !== true &&
        declared.partner?.name === port.name,
    );
    const only = own.length === 1 ? own[0] : undefined;
    return { port, driver: only === undefined ? "memory" : driverName(only.file, port.name) };
  });
}
