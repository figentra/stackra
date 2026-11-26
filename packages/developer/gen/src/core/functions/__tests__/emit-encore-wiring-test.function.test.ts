/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreWiringTest`: a service that runs as a generated Encore app and declares Vitest gets
 *          `.stackra/tests/encore-wiring.test.ts`, which imports the service declaration, the server app and every
 *          generated Encore file with an endpoint, a CronJob, a topic, a subscription or the database; lists one route
 *          per endpoint `encoreEndpoints` reads (a guarded call is refused without and with a credential that does not
 *          verify, an anonymous call and a controller only answer the preflight; path parameters and wildcards are
 *          filled); lists the exported endpoints and the constructed resources; and checks the database with the model
 *          tables. A package, an authored entry, a service without Vitest or without its Encore service gets none.
 * Boundary: test only; runs on the commerce IR fixture, the manifest `buildManifest` derives from it, the real
 *           `api.ts` `emitEncoreApi` prints and hand-written Encore files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 3: the thin Encore wiring suite); STA-2838.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreApi } from "#core/functions/emit-encore-api.function";
import { emitEncoreWiringTest } from "#core/functions/emit-encore-wiring-test.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A class of the orders module with `kind` and `options`, and no dependencies. */
function declared(
  name: string,
  kind: DeclaredClass["kind"],
  stem: string,
  options: Record<string, unknown>,
): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/${kind}/${stem}.${kind}.ts`,
    importPath: `#modules/orders/${kind}/${stem}.${kind}`,
    options,
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

const IR: MemberIR = {
  ...COMMERCE_IR,
  packages: [...(COMMERCE_IR.packages ?? []), "vitest", "@stackra/vitest-config"],
  classes: [
    ...COMMERCE_IR.classes,
    declared("CheckHealthQuery", "query", "check-health", {
      key: "health.check",
      actors: ["anonymous", "user"],
    }),
    declared("AuthCallbackController", "controller", "auth-callback", { path: "/api/auth/*" }),
  ],
};
const MANIFEST = buildManifest(IR).manifest;
const API = emitEncoreApi(IR, MANIFEST) as GeneratedFile;

/** The Encore files gen writes for the commerce service, with a CronJob, a topic and a subscription. */
const FILES: readonly GeneratedFile[] = [
  {
    path: "stackra-encore/commerce/encore.service.ts",
    content: 'export default new Service("commerce");\n',
  },
  API,
  {
    path: "stackra-encore/commerce/cron.ts",
    content: [
      "export const ordersPurge1 = api({ expose: false }, async () => {});",
      'export const ordersPurge1Job = new CronJob("orders-purge-1", { every: "1h", endpoint: ordersPurge1 });',
    ].join("\n"),
  },
  {
    path: "stackra-encore/commerce/queues.ts",
    content: [
      'export const queueDefault = new Topic<BrokerMessage>("queue-default", {});',
      'export const queueDefaultSubscription = new Subscription(queueDefault, "queue-default", {});',
    ].join("\n"),
  },
  {
    path: "stackra-encore/commerce/database.ts",
    content: 'export const database = new SQLDatabase("commerce");\n',
  },
  // Neither an endpoint nor a resource: not imported.
  {
    path: "stackra-encore/commerce/broker-message.ts",
    content: "export interface BrokerMessage {}\n",
  },
  // Another member's folder: not this service's.
  {
    path: "stackra-encore/other/cron.ts",
    content: "export const elsewhere = api({}, async () => {});\n",
  },
];

describe(emitEncoreWiringTest, () => {
  const suite = emitEncoreWiringTest(IR, MANIFEST, FILES);
  const content = suite?.content ?? "";

  it("writes the suite of a generated Encore service into .stackra/tests", () => {
    expect(suite?.path).toBe(".stackra/tests/encore-wiring.test.ts");
    for (const line of [
      'import { describe, expect, it } from "vitest";',
      'import { CronJob } from "encore.dev/cron";',
      'import { Subscription, Topic } from "encore.dev/pubsub";',
      'import { Service } from "encore.dev/service";',
      'import { app } from "../entry/server";',
      'import service from "../../stackra-encore/commerce/encore.service";',
      'import * as encore0 from "../../stackra-encore/commerce/api";',
      'import * as encore1 from "../../stackra-encore/commerce/cron";',
      'import * as encore2 from "../../stackra-encore/commerce/database";',
      'import * as encore3 from "../../stackra-encore/commerce/queues";',
    ])
      expect(content).toContain(line);
    expect(content).not.toContain("broker-message");
    expect(content).not.toContain("stackra-encore/other");
    expect(content).not.toContain("elsewhere");
  });

  it("checks the service declaration and the boot", () => {
    expect(content).toContain("    expect(service).toBeInstanceOf(Service);");
    expect(content).toContain('    expect(service.name).toBe("commerce");');
    expect(content).toContain(
      "    await expect(app.handlers.run(async (container) => container !== undefined)).resolves.toBe(true);",
    );
  });

  it("probes every endpoint api.ts declares: a guarded call, an anonymous call and a controller", () => {
    const routes = content.slice(content.indexOf("const ROUTES"), content.indexOf("const GUARDED"));
    // One row per api.raw adapter, so an endpoint gen declares and the suite forgets fails here.
    expect(routes.match(/^ {2}\{ handler: /gm)).toHaveLength(
      API.content.match(/= api\.raw\(/g)?.length ?? -1,
    );
    expect(routes).toContain(
      '{ handler: encore0.ordersOrderCancelV1, label: "PUT /app/orders/:orderId/cancel", method: "PUT", probe: "/app/orders/wiring/cancel", guarded: true },',
    );
    expect(routes).toContain(
      '{ handler: encore0.ordersHealthCheckV1, label: "GET /app/healths/check", method: "GET", probe: "/app/healths/check", guarded: false },',
    );
    expect(routes).toContain(
      '{ handler: encore0.authCallbackController, label: "/api/auth/* (AuthCallbackController)", method: "GET", probe: "/api/auth/wiring", guarded: false },',
    );
  });

  it("answers every preflight, and refuses a guarded call without and with a credential that does not verify", () => {
    expect(content).toContain("const GUARDED = ROUTES.filter((route) => route.guarded);");
    expect(content).toContain('  it.each(ROUTES)("answers the preflight of $label"');
    expect(content).toContain(
      '    expect((await answer(handler, "OPTIONS", probe)).status).toBe(204);',
    );
    expect(content).toContain('  it.each(GUARDED)("refuses $label without a credential"');
    expect(content).toContain(
      '  it.each(GUARDED)("refuses $label with a bearer token that does not verify"',
    );
    // Refused before it runs: by authentication, or first by a request guard (ADR 0437's order), never a 2xx or 500.
    expect(content).toContain(
      'const REFUSED: Readonly<Record<number, string>> = { 401: "request_refused", 403: "request_refused", 429: "rate_limited" };',
    );
    expect(content).toContain(
      "  expect(JSON.parse(body)).toMatchObject({ code: REFUSED[status] });",
    );
    expect(content).toContain("    expectRefused(await answer(handler, method, probe));");
    expect(content).toContain(
      '    expectRefused(await answer(handler, method, probe, { authorization: "Bearer wiring.not-a.token" }));',
    );
  });

  it("lists every exported endpoint and every constructed CronJob, topic and subscription", () => {
    for (const line of [
      '  ["ordersOrderCancelV1", encore0.ordersOrderCancelV1],',
      '  ["authCallbackController", encore0.authCallbackController],',
      '  ["ordersPurge1", encore1.ordersPurge1],',
      '  ["ordersPurge1Job", encore1.ordersPurge1Job, CronJob],',
      '  ["queueDefault", encore3.queueDefault, Topic],',
      '  ["queueDefaultSubscription", encore3.queueDefaultSubscription, Subscription],',
    ])
      expect(content).toContain(line);
  });

  it("checks the database answers with every model table migrated", () => {
    const tables = (MANIFEST.models ?? []).map((model) => (model as { table?: string }).table);
    expect(tables.length).toBeGreaterThan(0);
    expect(content).toContain(
      `const TABLES: readonly string[] = [${tables.map((table) => JSON.stringify(table)).join(", ")}];`,
    );
    expect(content).toContain("    const database = encore2.database;");
    expect(content).toContain("SELECT to_regclass(${table})::text AS name");
  });

  it("leaves the database check out when the service has no database", () => {
    const text =
      emitEncoreWiringTest(
        IR,
        MANIFEST,
        FILES.filter((file) => !file.path.endsWith("/database.ts")),
      )?.content ?? "";
    expect(text).not.toContain("connects the service database");
    expect(text).not.toContain("commerce/database");
  });

  it("writes no route rows when gen wrote no api.ts, and still checks the rest", () => {
    const text =
      emitEncoreWiringTest(
        IR,
        MANIFEST,
        FILES.filter((file) => file !== API),
      )?.content ?? "";
    expect(text).toContain("const ROUTES: readonly {");
    expect(text).not.toContain("{ handler: ");
    expect(text).toContain('  ["ordersPurge1Job", encore0.ordersPurge1Job, CronJob],');
  });

  it("loads the environment and the database gen wrote before the server app, as every generated Encore file does", () => {
    const withApp: MemberIR = { ...IR, packages: [...(IR.packages ?? []), "@stackra/app"] };
    const environment: GeneratedFile = {
      path: "stackra-encore/commerce/environment.ts",
      content: "providePlatformEnvironment(appMeta().environment);\n",
    };
    const text = emitEncoreWiringTest(withApp, MANIFEST, [...FILES, environment])?.content ?? "";
    const order = [
      'import "../../stackra-encore/commerce/environment";',
      'import "../../stackra-encore/commerce/database";',
      'import { app } from "../entry/server";',
    ].map((line) => text.indexOf(line));
    expect(order.every((at) => at > 0)).toBe(true);
    expect(order[0]).toBeLessThan(order[1] ?? 0);
    expect(order[1]).toBeLessThan(order[2] ?? 0);
    // A setup file gen did not write is not imported.
    expect(content).not.toContain('import "../../stackra-encore/commerce/environment";');
    const noDatabase =
      emitEncoreWiringTest(
        withApp,
        MANIFEST,
        [...FILES, environment].filter((file) => !file.path.endsWith("/database.ts")),
      )?.content ?? "";
    expect(noDatabase).toContain('import "../../stackra-encore/commerce/environment";');
    expect(noDatabase).not.toContain("commerce/database");
  });

  it("writes none for a package, an authored entry, a service without Vitest or without its Encore service", () => {
    expect(emitEncoreWiringTest({ ...IR, layout: "package" }, MANIFEST, FILES)).toBeUndefined();
    expect(emitEncoreWiringTest({ ...IR, authoredMain: true }, MANIFEST, FILES)).toBeUndefined();
    expect(emitEncoreWiringTest({ ...IR, packages: ["vitest"] }, MANIFEST, FILES)).toBeUndefined();
    expect(
      emitEncoreWiringTest(
        IR,
        MANIFEST,
        FILES.filter((file) => !file.path.endsWith("encore.service.ts")),
      ),
    ).toBeUndefined();
  });
});
