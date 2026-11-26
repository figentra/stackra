/**
 * Stackra file contract:
 * Purpose: `emitEncoreWiringTest`, a service's generated Encore wiring suite (`.stackra/tests/encore-wiring.test.ts`),
 *          run by `stackra test --tier wiring` under `encore test`, where the Encore runtime, the app's metadata and a
 *          migrated test database are real. It checks the wiring only, never business logic (ADR 0182 decision 3): the
 *          folder is the Encore service of the member; the server app boots from the root module and the generated
 *          wiring; every endpoint `encoreEndpoints` lists is exported and answers its route through `answerCall` (a CORS
 *          preflight is 204, and an action or query that no anonymous caller may reach refuses a call with no credential,
 *          and one whose bearer token does not verify, as 401 `request_refused`, so it never runs); every other
 *          generated endpoint (a CronJob's, the inbox) is exported; every generated `CronJob`, `Topic` and
 *          `Subscription` is constructed by the Encore runtime; and the service database answers with each of the
 *          member's model tables migrated.
 * Boundary: pure; reads `ir`, the manifest and the Encore files gen wrote for it (`files`), whose `export const` lines
 *           it lists. Written only for a service that runs as a generated Encore app (no authored `src/main.ts`), declares
 *           `vitest` and `@stackra/vitest-config` (the suite imports Vitest, and its config the preset; a scaffolded service declares both), and has its Encore service declaration among `files`. Each route is answered on a
 *           loopback `node:http` server that hands the raw request to the exported handler, as Encore's gateway does;
 *           Encore's own router is checked when `encore test` compiles the app. No call carries a valid credential and
 *           no anonymous action is run, so the suite changes no data.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); ADR 0091 (decision 2: the
 *                     generated Encore app); ADR 0437 (the server-check order); ADR 0098 (the actor from the
 *                     credential); ADR 0295 (generated output in `.stackra/`); STA-2838.
 */
import type { StackraManifest } from "@stackra/contracts";

import { ENCORE_WIRING_TEST } from "#core/constants/encore-wiring-test.constant";
import { encoreEndpoints } from "#core/functions/encore-endpoints.function";
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The Encore classes a generated file constructs, and the module each comes from. */
const ENCORE_CLASSES: Readonly<Record<string, string>> = {
  CronJob: "encore.dev/cron",
  Subscription: "encore.dev/pubsub",
  Topic: "encore.dev/pubsub",
};

/** An `export const <name> = new <Class>(` or `<Class><...>(` line of a generated Encore file. */
const CONSTRUCTED = /^export const (\w+) = new (CronJob|Subscription|Topic)\b/gm;

/** An `export const <name> = api(` or `api.raw(` line of a generated Encore file. */
const ENDPOINT = /^export const (\w+) = api(?:\.raw)?\(/gm;

/** The probe path of a route: each `:param` and the wildcard filled with one segment. */
function probePath(route: string): string {
  return route.replaceAll(/\/:\w+/g, "/wiring").replace(/\/\*\w*$/, "/wiring");
}

/** The module specifier of a generated Encore file, relative to `.stackra/tests/`. */
function specifierOf(path: string): string {
  return `../../${path.replace(/\.ts$/, "")}`;
}

/**
 * The Encore wiring suite of a service, or undefined when the member is not a generated Encore app or cannot run it.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest built from `ir`.
 * @param files - the files gen wrote for the member so far, its Encore files among them.
 * @example
 * emitEncoreWiringTest(serviceIr, manifest, files)?.path; // ".stackra/tests/encore-wiring.test.ts"
 */
export function emitEncoreWiringTest(
  ir: MemberIR,
  manifest: StackraManifest,
  files: readonly GeneratedFile[],
): GeneratedFile | undefined {
  const folder = encoreServiceFolder(ir.member);
  const serviceFile = `${folder}/encore.service.ts`;
  if (
    ir.layout !== "service" ||
    ir.authoredMain === true ||
    !["vitest", "@stackra/vitest-config"].every((name) => (ir.packages ?? []).includes(name)) ||
    !files.some((file) => file.path === serviceFile)
  )
    return undefined;

  const encoreFiles = files
    .filter((file) => file.path.startsWith(`${folder}/`) && file.path.endsWith(".ts"))
    .filter((file) => file.path !== serviceFile)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy made here; toSorted is ES2023 and the base lib is ES2022
    .sort((a, b) => a.path.localeCompare(b.path));
  const imports: string[] = [];
  const aliases = new Map<string, string>();
  const constructed: { name: string; type: string }[] = [];
  const handlers: string[] = [];
  const classes = new Set<string>();
  for (const file of encoreFiles) {
    const objects = [...file.content.matchAll(CONSTRUCTED)].map(([, name = "", type = ""]) => ({
      name,
      type,
    }));
    const endpoints = [...file.content.matchAll(ENDPOINT)].map(([, name = ""]) => name);
    if (objects.length === 0 && endpoints.length === 0 && !file.path.endsWith("/database.ts"))
      continue;
    const alias = `encore${aliases.size}`;
    aliases.set(file.path, alias);
    imports.push(`import * as ${alias} from ${JSON.stringify(specifierOf(file.path))};`);
    for (const { name, type } of objects) {
      constructed.push({ name: `${alias}.${name}`, type });
      classes.add(type);
    }
    for (const name of endpoints) handlers.push(`${alias}.${name}`);
  }
  const apiAlias = aliases.get(`${folder}/api.ts`);
  const routes =
    apiAlias === undefined
      ? []
      : encoreEndpoints(ir, manifest).map((endpoint) =>
          endpoint.kind === "call"
            ? {
                handler: `${apiAlias}.${endpoint.name}`,
                label: `${endpoint.method} ${endpoint.path}`,
                method: endpoint.method,
                probe: probePath(endpoint.path),
                guarded: !endpoint.anonymous,
              }
            : {
                handler: `${apiAlias}.${endpoint.name}`,
                label: `${endpoint.path} (${endpoint.class.name})`,
                method: "GET",
                probe: probePath(endpoint.route),
                guarded: false,
              },
        );
  const databaseAlias = aliases.get(`${folder}/database.ts`);
  const tables = (manifest.models ?? [])
    .map((model) => (model as { table?: unknown }).table)
    .filter((table): table is string => typeof table === "string");

  const byModule = new Map<string, string[]>();
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy made here; toSorted is ES2023 and the base lib is ES2022
  for (const type of [...classes].sort()) {
    const from = ENCORE_CLASSES[type] ?? "encore.dev";
    byModule.set(from, [...(byModule.get(from) ?? []), type]);
  }
  const lines = [
    generatedHeader({
      from: "the generated Encore app (stackra-encore/) and stackra.manifest.json",
      purpose: `the Encore wiring suite of ${ir.package}: the service, the boot, every route, endpoint, CronJob, topic and subscription, and the migrated database.`,
      boundary:
        "the wiring only (ADR 0182 decision 3), never business logic; runs under `encore test` " +
        "(`stackra test --tier wiring`); no call carries a valid credential, so no action runs and no data changes.",
      runtime: "node",
    }),
    'import { createServer, type IncomingMessage, type ServerResponse } from "node:http";',
    'import type { AddressInfo } from "node:net";',
    "",
    'import { describe, expect, it } from "vitest";',
    ...[...byModule].map(
      ([from, names]) => `import { ${names.join(", ")} } from ${JSON.stringify(from)};`,
    ),
    'import { Service } from "encore.dev/service";',
    "",
    'import { app } from "../entry/server";',
    `import service from ${JSON.stringify(specifierOf(serviceFile))};`,
    ...imports,
    "",
    "/** A raw Encore handler, as `api.raw()` declares it. */",
    "type RawHandler = (req: IncomingMessage, resp: ServerResponse) => unknown;",
    "",
    "/** Answers one request to `handler` on a loopback server, which hands it the raw request as Encore's gateway does. */",
    "async function answer(",
    "  handler: RawHandler,",
    "  method: string,",
    "  path: string,",
    "  headers: Record<string, string> = {},",
    "): Promise<{ status: number; body: string }> {",
    "  const server = createServer((req, resp) => {",
    "    Promise.resolve(handler(req, resp)).catch((error: unknown) => {",
    "      // Encore answers a handler that throws with 500; so does the probe, naming the error.",
    "      if (!resp.headersSent) resp.writeHead(500);",
    "      resp.end(error instanceof Error ? error.message : String(error));",
    "    });",
    "  });",
    '  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));',
    "  try {",
    "    const { port } = server.address() as AddressInfo;",
    "    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers });",
    "    return { status: response.status, body: await response.text() };",
    "  } finally {",
    "    server.closeAllConnections();",
    "    await new Promise((resolve) => server.close(resolve));",
    "  }",
    "}",
    "",
    "/** Each route of the app: its adapter, the request that probes it, and whether a call needs a credential. */",
    "const ROUTES: readonly {",
    "  handler: RawHandler;",
    "  label: string;",
    "  method: string;",
    "  probe: string;",
    "  guarded: boolean;",
    "}[] = [",
    ...routes.map(
      (route) =>
        `  { handler: ${route.handler}, label: ${JSON.stringify(route.label)}, method: ${JSON.stringify(route.method)}, probe: ${JSON.stringify(route.probe)}, guarded: ${route.guarded} },`,
    ),
    "];",
    "",
    "/** The routes no anonymous caller may reach. */",
    "const GUARDED = ROUTES.filter((route) => route.guarded);",
    "",
    "/** Every generated endpoint, by its export. */",
    "const ENDPOINTS: readonly [string, unknown][] = [",
    ...handlers.map(
      (handler) => `  [${JSON.stringify(handler.replace(/^encore\d+\./, ""))}, ${handler}],`,
    ),
    "];",
    "",
    "/** Every CronJob, topic and subscription the Encore runtime constructs, with its class. */",
    "const RESOURCES: readonly [string, unknown, abstract new (...args: never[]) => unknown][] = [",
    ...constructed.map(
      ({ name, type }) =>
        `  [${JSON.stringify(name.replace(/^encore\d+\./, ""))}, ${name}, ${type}],`,
    ),
    "];",
    "",
    `/** The member's model tables, which the service database's migrations create. */`,
    `const TABLES: readonly string[] = [${tables.map((table) => JSON.stringify(table)).join(", ")}];`,
    "",
    `describe("the Encore wiring of ${ir.package}", () => {`,
    `  it("declares the Encore service ${ir.member}", () => {`,
    "    expect(service).toBeInstanceOf(Service);",
    `    expect(service.name).toBe(${JSON.stringify(ir.member)});`,
    "  });",
    "",
    '  it("boots the server app from the root module and the generated wiring", async () => {',
    "    await expect(app.handlers.run(async (container) => container !== undefined)).resolves.toBe(true);",
    "  });",
    "",
    '  it.each(ENDPOINTS)("exports the endpoint %s", (_name, endpoint) => {',
    '    expect(typeof endpoint).toBe("function");',
    "  });",
    "",
    '  it.each(RESOURCES)("constructs %s", (_name, resource, type) => {',
    "    expect(resource).toBeInstanceOf(type);",
    "  });",
    "",
    '  it.each(ROUTES)("answers the preflight of $label", async ({ handler, probe }) => {',
    '    expect((await answer(handler, "OPTIONS", probe)).status).toBe(204);',
    "  });",
    "",
    '  it.each(GUARDED)("refuses $label without a credential", async ({ handler, method, probe }) => {',
    "    const { status, body } = await answer(handler, method, probe);",
    "    expect(status).toBe(401);",
    '    expect(JSON.parse(body)).toMatchObject({ code: "request_refused" });',
    "  });",
    "",
    '  it.each(GUARDED)("refuses $label with a bearer token that does not verify", async ({ handler, method, probe }) => {',
    "    const { status, body } = await answer(handler, method, probe, {",
    '      authorization: "Bearer wiring.not-a.token",',
    "    });",
    "    expect(status).toBe(401);",
    '    expect(JSON.parse(body)).toMatchObject({ code: "request_refused" });',
    "  });",
    ...(databaseAlias === undefined
      ? []
      : [
          "",
          '  it("connects the service database with its migrations applied", async () => {',
          `    const database = ${databaseAlias}.database;`,
          "    expect(await database.queryRow`SELECT 1 AS ok`).toEqual({ ok: 1 });",
          "    for (const table of TABLES) {",
          "      const found = await database.queryRow<{ name: string | null }>`SELECT to_regclass(${table})::text AS name`;",
          "      expect(found?.name, table).not.toBeNull();",
          "    }",
          "  });",
        ]),
    "});",
    "",
  ];
  return { path: ENCORE_WIRING_TEST, content: lines.join("\n") };
}
