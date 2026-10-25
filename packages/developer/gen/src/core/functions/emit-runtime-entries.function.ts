/**
 * Stackra file contract:
 * Purpose: `emitRuntimeEntries`, the runtime entries of a deployed member (`.stackra/entry/<runtime>.ts`): each loads
 *          the generated files its runtime needs (a server's registrations; a client's route table and blocks), then
 *          calls `createApp` from the `@stackra/app` subpath of its runtime in the form that subpath takes, and
 *          exports the result. A service gets `server`; an app gets `browser` (web, PWA, the desktop renderer) and
 *          `native` (iOS and Android).
 * Boundary: pure; no logic in an entry (boot order, signals and readiness belong to `createApp`). A package gets no
 *           runtime entry; a host imports its module. A worker's and the desktop main process's entries need their
 *           tool facts (the React Router server build, the crash page, the renderer and preload paths), which come
 *           with the Wrangler and electron-builder configs, so gen writes none for them yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 to 9: generated runtime entries, `createApp` per subpath, no service
 *                     factory); ADR 0127 2026-10-24 note (the runtime-target entries).
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** What each runtime's `createApp` returns (ADR 0295 decision 8). */
const RETURNS: Readonly<Record<string, string>> = {
  server: "`ServerApp`: `key`, `ready()`, `drain()`, `close()` and the generated `handlers`.",
  browser: "`BrowserApp`: `mount(root)`, `hydrate()` and the `router`.",
  native: "`NativeApp`: the `Root` component.",
};

/**
 * The runtime entries of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param generated - the paths this run writes, so an entry loads only the generated files that exist.
 * @example
 * emitRuntimeEntries(serviceIr)[0]?.path; // ".stackra/entry/server.ts"
 */
export function emitRuntimeEntries(
  ir: MemberIR,
  generated: readonly string[] = [],
): GeneratedFile[] {
  const root = rootModuleOf(ir);
  if (root === undefined) return [];
  const runtimes = ir.layout === "service" ? ["server"] : clientRuntimes(ir);
  return runtimes.map((runtime) => {
    const loads = (
      runtime === "server" ? ["registrations"] : [`routes/${runtime}`, `blocks/${runtime}`]
    )
      .filter((name) => generated.includes(`.stackra/gen/${name}.ts`))
      .map((name) => `import "#stackra/${name}";`);
    const call =
      runtime === "browser"
        ? "await createApp(wiring)"
        : runtime === "native"
          ? `createApp(${root.name}, { wiring })`
          : `await createApp(${root.name}, { wiring })`;
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
        ...loads,
        `import { createApp } from "@stackra/app/${runtime}";`,
        ...(runtime === "browser" ? [] : [`import { ${root.name} } from "${root.from}";`]),
        'import { wiring } from "#stackra/wiring";',
        "",
        `/** ${RETURNS[runtime] ?? "The app of this runtime."} */`,
        `export const app = ${call};`,
        "",
      ].join("\n"),
    };
  });
}
