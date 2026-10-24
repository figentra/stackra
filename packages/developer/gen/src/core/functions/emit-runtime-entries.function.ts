/**
 * Stackra file contract:
 * Purpose: `emitRuntimeEntries`, the runtime entries of a deployed member (`.stackra/entry/<target>.ts`): each calls
 *          `createApp` from the `@stackra/app` subpath of its target with the member's root module and the generated
 *          wiring, and exports the result. A service gets `server`, a worker `worker`, an app one entry per runtime
 *          its targets need (web `browser`, desktop `electron`, iOS and Android one `native`).
 * Boundary: pure; no logic in an entry (boot order, signals and readiness belong to `createApp`). A package gets no
 *           runtime entry; a host imports its module. Target-specific arguments (an app's router build, a worker's
 *           env) are added by `@stackra/app` when it lands (W5).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 to 9: generated runtime entries, `createApp` per subpath, no service
 *                     factory); ADR 0127 2026-10-24 note (the runtime-target entries).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The runtime an app target runs on. */
const APP_RUNTIMES: Readonly<Record<string, string>> = {
  web: "browser",
  desktop: "electron",
  ios: "native",
  android: "native",
};

/** What each runtime's `createApp` returns (ADR 0295 decision 8). */
const RETURNS: Readonly<Record<string, string>> = {
  server: "`ServerApp`: `key`, `ready()`, `drain()`, `close()` and the generated `handlers`.",
  browser: "`BrowserApp`: `mount(root)`, `hydrate()` and the `router`.",
  native: "`NativeApp`: the `Root` component.",
  worker: "`WorkerApp`: `fetch(request, env, ctx)`.",
  electron: "`DesktopApp`: `start()` and the `windows`.",
};

/**
 * The runtime entries of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitRuntimeEntries(serviceIr)[0]?.path; // ".stackra/entry/server.ts"
 */
export function emitRuntimeEntries(ir: MemberIR): GeneratedFile[] {
  const root = rootModuleOf(ir);
  if (ir.layout === "package" || root === undefined) return [];
  const runtimes =
    ir.layout === "service"
      ? ["server"]
      : ir.layout === "worker"
        ? ["worker"]
        : [
            ...new Set(
              (ir.targets ?? [])
                .map((target) => APP_RUNTIMES[target])
                .filter((runtime): runtime is string => runtime !== undefined),
            ),
          ];
  return runtimes.map((runtime) => {
    const header = generatedHeader({
      from: `stackra.config.ts, the root module and #stackra/wiring`,
      purpose: `the ${runtime} runtime entry of ${ir.package}: builds the app from the root module and the generated wiring.`,
      boundary:
        "no logic; `createApp` owns boot order, signals, readiness and shutdown. Top-level await: a boot error fails the " +
        "process.",
      runtime: runtime === "server" ? "node" : "isomorphic",
    });
    return {
      path: `.stackra/entry/${runtime}.ts`,
      content: [
        header,
        `import { createApp } from "@stackra/app/${runtime}";`,
        `import { ${root.name} } from "${root.from}";`,
        'import { wiring } from "#stackra/wiring";',
        "",
        `/** ${RETURNS[runtime] ?? "The app of this runtime."} */`,
        `export const app = await createApp(${root.name}, { wiring });`,
        "",
      ].join("\n"),
    };
  });
}
