/**
 * Stackra file contract:
 * Purpose: `emitRuntimeEntries`, the runtime entries of a deployed member (`.stackra/entry/<runtime>.ts`): each loads
 *          the generated files its runtime needs (a server's registrations; a client's route table and blocks), then
 *          calls `createApp` from the `@stackra/app` subpath of its runtime in the form that subpath takes, and
 *          exports the result. A service gets `server`; an app gets `browser` (web, PWA, the desktop renderer) and
 *          `native` (iOS and Android). A service's server entry hands `createApp` its `#stackra/boot` when gen writes
 *          one, so the bus, inbox and relay connect at service start. The native entry of an app with web and native
 *          targets takes `nativeWiring`, whose follow-the-system ports default to the native drivers. A service with
 *          seeders and a boot also gets `seed`, which `stackra db seed` runs: it boots the container, connects the
 *          database over `directDatabaseUrl()` without the relay loop, hands `runSeedEntry` its seeders (key, module,
 *          profile and class, in module order) and the command's arguments, then disconnects (STA-1709).
 * Boundary: pure; no logic in an entry (boot order, signals and readiness belong to `createApp`). A package gets no
 *           runtime entry; a host imports its module. A worker's and the desktop main process's entries need their
 *           tool facts (the React Router server build, the crash page, the renderer and preload paths), which come
 *           with the Wrangler and electron-builder configs, so gen writes none for them yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 7 to 9: generated runtime entries, `createApp` per subpath, no service
 *                     factory); ADR 0127 2026-10-24 note (the runtime-target entries); ADR 0263 (boot runs on the ready
 *                     container); ADR 0260 (decision 4).
 */
import { clientRuntimes } from "#core/functions/client-runtimes.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import { tokenExpression } from "#core/functions/token-expression.function";
import type { ClassRef } from "#core/types/class-ref.type";
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
  const seed = ir.layout === "service" ? seedEntry(ir, generated) : undefined;
  return [
    ...runtimes.map((runtime) => {
      const loads = (
        runtime === "server" ? ["registrations"] : [`routes/${runtime}`, `blocks/${runtime}`]
      )
        .filter((name) => generated.includes(`.stackra/gen/${name}.ts`))
        .map((name) => `import "#stackra/${name}";`);
      const boots = runtime === "server" && generated.includes(".stackra/gen/boot.ts");
      const call =
        runtime === "browser"
          ? "await createApp(wiring)"
          : runtime === "native"
            ? `createApp(${root.name}, { wiring })`
            : `await createApp(${root.name}, { wiring${boots ? ", boot" : ""} })`;
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
          ...(boots ? ['import { boot } from "#stackra/boot";'] : []),
          `import { createApp } from "@stackra/app/${runtime}";`,
          ...(runtime === "browser" ? [] : [`import { ${root.name} } from "${root.from}";`]),
          // A web-and-native app's shared wiring takes memory; its native entry takes the native drivers.
          runtime === "native" && runtimes.length > 1
            ? 'import { nativeWiring as wiring } from "#stackra/wiring";'
            : 'import { wiring } from "#stackra/wiring";',
          "",
          `/** ${RETURNS[runtime] ?? "The app of this runtime."} */`,
          `export const app = ${call};`,
          "",
        ].join("\n"),
      };
    }),
    ...(seed === undefined ? [] : [seed]),
  ];
}

/** The seed entry of a service with seeders and a boot, or undefined (STA-1709). */
function seedEntry(ir: MemberIR, generated: readonly string[]): GeneratedFile | undefined {
  const root = rootModuleOf(ir);
  const seeders = ir.classes.filter((declared) => declared.kind === "seeder");
  if (root === undefined || seeders.length === 0 || !generated.includes(".stackra/gen/boot.ts"))
    return undefined;
  // A seeder is not a binding, so the entry lists the tokens its constructor takes (STA-1698).
  const tokenImports = new Map<string, Map<string, boolean>>();
  const use = (target: ClassRef): string => {
    tokenImports.set(
      target.from,
      (tokenImports.get(target.from) ?? new Map<string, boolean>()).set(target.name, false),
    );
    return target.name;
  };
  const rows = seeders.map((declared) => {
    const profile = /([a-z]+)\.seeder\.ts$/.exec(declared.file)?.[1] ?? "minimal";
    const deps =
      declared.deps.length > 0
        ? `, deps: [${declared.deps.map((dep) => tokenExpression(dep, use)).join(", ")}]`
        : "";
    return `  { key: ${JSON.stringify(`${declared.module}.${profile}`)}, module: ${JSON.stringify(declared.module)}, profile: ${JSON.stringify(profile)}, type: ${declared.name}${deps} },`;
  });
  // `Database` comes from @stackra/database already; a token from there joins that import.
  const database = ["Database", ...(tokenImports.get("@stackra/database")?.keys() ?? [])];
  tokenImports.delete("@stackra/database");
  const header = generatedHeader({
    from: "stackra.config.ts, the root module, #stackra/wiring and the seeders under src/",
    purpose: `the seed entry of ${ir.package}: boots the container and runs the seeders \`stackra db seed\` asks for.`,
    boundary:
      "run by `stackra db seed` from the member's build; connects over the direct database url, starts no relay loop, " +
      "and disconnects when the seeders end. The exit code is the run's.",
    runtime: "node",
  });
  return {
    path: ".stackra/entry/seed.ts",
    content: [
      header,
      ...(generated.includes(".stackra/gen/registrations.ts")
        ? ['import "#stackra/registrations";']
        : []),
      'import { bootApp } from "@stackra/app";',
      `import { ${database.join(", ")} } from "@stackra/database";`,
      'import { directDatabaseUrl, runSeedEntry } from "@stackra/database/node";',
      'import { boot } from "#stackra/boot";',
      'import { wiring } from "#stackra/wiring";',
      `import { ${root.name} } from "${root.from}";`,
      ...seeders.map((declared) => `import { ${declared.name} } from "${declared.importPath}";`),
      ...importLines(tokenImports),
      "",
      `const { container } = await bootApp(wiring, { roots: [${root.name}], env: process.env });`,
      "const shutdown = new AbortController();",
      "await boot(container, { signal: shutdown.signal, url: directDatabaseUrl(), relay: false });",
      "try {",
      "  process.exitCode = await runSeedEntry({",
      "    container,",
      `    member: ${JSON.stringify(ir.member)},`,
      "    seeders: [",
      ...rows.map((row) => `    ${row}`),
      "    ],",
      "    argv: process.argv.slice(2),",
      "  });",
      "} finally {",
      "  shutdown.abort();",
      "  await Database.current().close();",
      "  await container.close();",
      "}",
      "",
    ].join("\n"),
  };
}
