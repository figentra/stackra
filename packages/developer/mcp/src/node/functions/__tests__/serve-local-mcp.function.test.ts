/**
 * Stackra file contract:
 * Purpose: unit tests of `serveLocalMcp`: the handshake answers the client's protocol revision; `tools/list` holds the
 *          built-in tool commands in order with their MCP hints and the Encore tools under `encore_` across every
 *          `tools/list` page; `manifest`, `app_info` and `routes` read the repository, and a section, kind or member a
 *          tool does not have is refused naming the ones there are; `new`, `gen`, `validate`, `check`, `verify`,
 *          `test`, `typecheck` and `lint` run through the given CLI runner (the CLI's gates), in a member's folder when
 *          named; every tool answers `{ ok, diagnostics, data?, error? }`: each finding (a failed test, a type error,
 *          a lint finding, a gen refusal, a check finding) one `Diagnostic` with its phase, code, file from the
 *          repository root and line, a listed code linked through `stackra explain`, and the full log at
 *          `.stackra/logs/last-<tool>.log`; a bad input is a tool error and nothing runs; a writing tool is refused on a
 *          deployed target, as one `deployed_target` diagnostic, while a read-only one still answers; an Encore call is forwarded unprefixed; the server
 *          resolves when the client disconnects; a host tool replaces the built-in of its name.
 * Boundary: test only; in-memory streams, a fake runner, a fake Encore peer and a throwaway repository in the OS temp
 *           directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5 and enforcement); R-29; STA-2873;
 *                     STA-2886.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { connectMcp } from "#node/functions/connect-mcp.function";
import { serveLocalMcp } from "#node/functions/serve-local-mcp.function";
import type { LocalTool } from "#node/types/local-tool.type";
import type { McpPeer } from "#node/types/mcp-peer.type";
import type { StackraRunner } from "#node/types/stackra-runner.type";

let root: string;

/** Writes `value` as JSON at `path` under the root. */
function writeJson(path: string, value: unknown): void {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), JSON.stringify(value));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
  writeJson("package.json", { name: "acme", version: "0.1.0", packageManager: "pnpm@12.16.1" });
  writeJson("services/commerce/package.json", { name: "@acme/service-commerce" });
  writeJson("services/commerce/stackra.manifest.json", {
    member: "commerce",
    package: "@acme/service-commerce",
    version: "1",
    actions: [
      {
        key: "orders.order.cancel@1",
        kind: "action",
        permission: "orders.order.cancel",
        risk: "L2",
        endpoint: { method: "POST", path: "/orders/cancel" },
      },
      { key: "orders.order.list@1", kind: "query", endpoint: { method: "GET", path: "/orders" } },
      { key: "orders.order.purge@1", kind: "action" },
    ],
    events: [],
  });
  writeJson("apps/web/package.json", { name: "@acme/web" });
  writeJson("apps/web/stackra.manifest.json", {
    member: "web",
    package: "@acme/web",
    version: "1",
    kind: "app",
    routes: [{ key: "orders", class: "OrdersRoute", file: "src/routes/orders.route.ts" }],
  });
  writeJson("packages/data/search/package.json", { name: "@acme/search" });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A started server with a client peer. */
function start(
  run: StackraRunner,
  options: {
    readonly encore?: McpPeer | null;
    readonly tools?: readonly LocalTool[];
    readonly env?: Record<string, string>;
  } = {},
) {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  const served = serveLocalMcp({
    version: "1.2.3",
    root,
    input: toServer,
    output: toClient,
    run,
    encore: options.encore ?? null,
    tools: options.tools ?? [],
    env: options.env ?? {},
  });
  const client = connectMcp(toClient, toServer);
  return { client, served, disconnect: () => toServer.end() };
}

/** A tool call's result. */
type Called = {
  readonly isError: boolean;
  readonly structuredContent: {
    readonly ok: boolean;
    readonly diagnostics: readonly Record<string, unknown>[];
    readonly data?: Record<string, unknown> & readonly unknown[];
    readonly error?: { readonly code?: string; readonly message: string; readonly fix?: string };
  };
};

/** The reference entry `stackra explain shape_number_kind` links. */
const SHAPES_DOCS = "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields";

/** What `stackra explain <code> --json` answers: the shapes entry for `shape_number_kind`, else an unknown code. */
const explained = (code: string | undefined) =>
  code === "shape_number_kind"
    ? { exitCode: 0, output: `${JSON.stringify({ ok: true, data: { docs: SHAPES_DOCS } })}\n` }
    : {
        exitCode: 2,
        output: '{"ok":false,"error":{"code":"usage","message":"unknown error code"}}\n',
      };

/** The runner calls other than the `explain` lookups. */
const commandCalls = (run: ReturnType<typeof vi.fn<StackraRunner>>) =>
  run.mock.calls.filter(([args]) => args[0] !== "explain");

/** Calls `name` with `args`. */
const call = async (client: McpPeer, name: string, args: unknown = {}): Promise<Called> =>
  (await client.request("tools/call", { name, arguments: args })) as Called;

/** An upstream Encore peer whose `tools/list` answers `pages` in turn, by cursor. */
function encorePeer(pages: readonly { tools: unknown[]; nextCursor?: string }[]) {
  const listed: unknown[] = [];
  const handle = vi.fn(async (method: string, params: unknown) => {
    if (method === "tools/list") {
      listed.push(params);
      const cursor = (params as { cursor?: string } | undefined)?.cursor;
      return pages[cursor === undefined ? 0 : Number(cursor)];
    }
    return { content: [{ type: "text", text: JSON.stringify(params) }] };
  });
  const toEncore = new PassThrough();
  const fromEncore = new PassThrough();
  connectMcp(toEncore, fromEncore, handle);
  return { peer: connectMcp(fromEncore, toEncore), handle, listed };
}

describe("serveLocalMcp", () => {
  it("answers the handshake and lists the built-in tools in order with their hints", async () => {
    const { client, served, disconnect } = start(vi.fn<StackraRunner>());

    await expect(
      client.request("initialize", { protocolVersion: "2025-06-18", capabilities: {} }),
    ).resolves.toEqual({
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "stackra", version: "1.2.3" },
    });
    await expect(
      client.request("initialize", { protocolVersion: "1999-01-01" }),
    ).resolves.toMatchObject({ protocolVersion: "2025-11-25" });
    await expect(client.request("ping")).resolves.toEqual({});

    const { tools } = (await client.request("tools/list")) as {
      tools: { name: string; inputSchema: Record<string, unknown>; annotations: unknown }[];
    };
    expect(tools.map((tool) => tool.name)).toEqual([
      "app_info",
      "manifest",
      "routes",
      "new",
      "gen",
      "validate",
      "check",
      "verify",
      "test",
      "typecheck",
      "lint",
    ]);
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    expect(byName.get("manifest")?.annotations).toEqual({ readOnlyHint: true });
    expect(byName.get("gen")?.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    });
    expect(byName.get("new")?.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    });
    expect(byName.get("new")?.inputSchema).toMatchObject({
      type: "object",
      required: ["kind", "name"],
      properties: {
        kind: {
          enum: [
            "package",
            "service",
            "seed-pack",
            "tooling",
            "app:console",
            "app:mobile",
            "app:desktop",
            "app:docs",
          ],
        },
      },
      additionalProperties: false,
    });

    await expect(client.request("resources/list")).rejects.toMatchObject({ code: -32_601 });
    disconnect();
    await expect(served).resolves.toBeUndefined();
  });

  it("reads manifests by member and section, refusing a section or member there is not", async () => {
    const { client, disconnect } = start(vi.fn<StackraRunner>());

    const all = await call(client, "manifest");
    expect(all.isError).toBe(false);
    expect(all.structuredContent).toMatchObject({ ok: true, diagnostics: [] });
    expect(all.structuredContent.data).toEqual([
      expect.objectContaining({ member: "web" }),
      expect.objectContaining({ member: "commerce" }),
    ]);

    const routes = await call(client, "manifest", { member: "web", section: "routes" });
    expect(routes.structuredContent.data).toEqual([
      { member: "web", routes: [expect.objectContaining({ key: "orders" })] },
    ]);
    const byFolder = await call(client, "manifest", {
      member: "services/commerce/",
      section: "events",
    });
    expect(byFolder.structuredContent.data).toEqual([{ member: "commerce", events: [] }]);

    // A section is only ever one the manifests hold; the refusal names them.
    const unknownSection = await call(client, "manifest", { section: "settings" });
    expect(unknownSection.isError).toBe(true);
    expect(unknownSection.structuredContent.error).toMatchObject({
      message: 'No manifest has a "settings" section',
      fix: "name one of: actions, events, kind, member, package, routes, version",
    });
    expect(unknownSection.structuredContent.diagnostics).toEqual([
      expect.objectContaining({
        phase: "manifest",
        severity: "error",
        message: 'No manifest has a "settings" section',
        fix: "name one of: actions, events, kind, member, package, routes, version",
      }),
    ]);

    const unknownMember = await call(client, "manifest", { member: "billing" });
    expect(unknownMember.isError).toBe(true);
    expect(unknownMember.structuredContent.error?.fix).toBe(
      "name one of: web, packages/data/search, commerce",
    );

    const noManifest = await call(client, "manifest", { member: "@acme/search" });
    expect(noManifest.structuredContent.error).toMatchObject({
      message: "@acme/search has no stackra.manifest.json yet",
      fix: "stackra gen",
    });
    disconnect();
  });

  it("answers the app facts: package, environment, runway, members and dev ports", async () => {
    writeFileSync(
      join(root, "runway.yaml"),
      [
        "version: 3",
        "project: acme",
        "environments: {}",
        "providers:",
        "  encore:",
        "    app: acme-x7",
        "",
      ].join("\n"),
    );
    writeJson(".stackra/dev/ports.json", {
      version: 1,
      environment: "dev",
      lane: 2,
      members: { web: { url: "http://localhost:5175", port: 5175, host: "localhost" } },
      infra: { postgres: { url: "postgres://localhost:5434", port: 5434 } },
    });
    const { client, disconnect } = start(vi.fn<StackraRunner>(), {
      env: { STACKRA_ENVIRONMENT: "test" },
    });

    const facts = await call(client, "app_info");
    expect(facts.isError).toBe(false);
    expect(facts.structuredContent.data).toMatchObject({
      root,
      package: { name: "acme", version: "0.1.0", packageManager: "pnpm@12.16.1" },
      node: process.version,
      environment: { name: "test", deployed: false },
      runway: { project: "acme", environments: [], providers: ["encore"], encoreApp: "acme-x7" },
      members: [
        {
          member: "web",
          package: "@acme/web",
          path: "apps/web",
          kind: "app",
          sections: { routes: 1 },
        },
        {
          member: null,
          package: "@acme/search",
          path: "packages/data/search",
          kind: "package",
          sections: null,
        },
        {
          member: "commerce",
          path: "services/commerce",
          kind: "service",
          sections: { actions: 3, events: 0 },
        },
      ],
      dev: {
        environment: "dev",
        lane: 2,
        members: { web: { url: "http://localhost:5175", port: 5175 } },
        infra: { postgres: { url: "postgres://localhost:5434", port: 5434 } },
      },
    });

    writeFileSync(join(root, "runway.yaml"), "version: [\n");
    const broken = await call(client, "app_info");
    expect(broken.structuredContent.data).toMatchObject({
      runway: { error: expect.stringContaining("runway.yaml") },
    });
    disconnect();
  });

  it("lists the HTTP endpoints by path and the app pages, filtered", async () => {
    const { client, disconnect } = start(vi.fn<StackraRunner>());

    const routes = await call(client, "routes");
    expect(routes.structuredContent.data).toEqual({
      endpoints: [
        {
          member: "commerce",
          method: "GET",
          path: "/orders",
          action: "orders.order.list@1",
          kind: "query",
        },
        {
          member: "commerce",
          method: "POST",
          path: "/orders/cancel",
          action: "orders.order.cancel@1",
          kind: "action",
          permission: "orders.order.cancel",
          risk: "L2",
        },
      ],
      pages: [{ member: "web", key: "orders", file: "src/routes/orders.route.ts" }],
    });

    const cancel = await call(client, "routes", { member: "commerce", search: "CANCEL" });
    expect(cancel.structuredContent.data).toEqual({
      endpoints: [expect.objectContaining({ path: "/orders/cancel" })],
      pages: [],
    });
    disconnect();
  });

  it("runs new, gen, validate and verify through the CLI runner with structured results", async () => {
    const run = vi.fn<StackraRunner>(async (args) => {
      if (args[0] === "explain") return explained(args[1]);
      if (args[0] === "verify")
        return {
          exitCode: 1,
          output:
            "lint: 3 files\n" +
            JSON.stringify(
              [
                {
                  phase: "lint",
                  rule: "eslint(no-debugger)",
                  path: "a.ts",
                  line: 3,
                  severity: "error",
                },
                { phase: "docs", rule: "contract", path: "b.ts", line: null, severity: "warning" },
              ],
              null,
              2,
            ) +
            "\n",
        };
      if (args[0] === "gen")
        return {
          exitCode: 1,
          output:
            "\u001B[31msrc/a.ts:4:3 error shape_number_kind Orders: a number needs a kind\u001B[39m\n" +
            "  fix: use @Int\ngen: 1 error(s) in .; nothing was written\n",
        };
      return { exitCode: 0, output: "Created packages/data/loyalty-kit\n" };
    });
    const { client, disconnect } = start(run);

    const created = await call(client, "new", {
      kind: "package",
      name: "loyalty-kit",
      category: "data",
      description: "--looks-like-a-flag",
      port: 3700,
      dryRun: true,
    });
    expect(created.isError).toBe(false);
    expect(created.structuredContent.data).toMatchObject({
      command:
        "stackra new package loyalty-kit --category=data --description=--looks-like-a-flag --port=3700 --dry-run",
      cwd: ".",
      exitCode: 0,
      ok: true,
      output: "Created packages/data/loyalty-kit\n",
    });

    const generated = await call(client, "gen", { check: true, member: "commerce" });
    expect(generated.isError).toBe(true);
    expect(generated.structuredContent).toEqual({
      ok: false,
      diagnostics: [
        {
          phase: "gen",
          file: "services/commerce/src/a.ts",
          line: 4,
          column: 3,
          severity: "error",
          code: "shape_number_kind",
          message: "Orders: a number needs a kind",
          fix: "use @Int",
          docsUrl: SHAPES_DOCS,
        },
      ],
      data: expect.objectContaining({
        command: "stackra gen --check",
        cwd: "services/commerce",
        exitCode: 1,
        log: ".stackra/logs/last-gen.log",
        errors: 1,
        warnings: 0,
      }),
    });
    expect(generated.structuredContent.data).not.toHaveProperty("diagnostics");

    expect((await call(client, "validate")).structuredContent).toMatchObject({
      ok: true,
      diagnostics: [],
    });
    const verified = await call(client, "verify", { keepGoing: true });
    expect(verified.isError).toBe(true);
    expect(verified.structuredContent).toMatchObject({
      ok: false,
      diagnostics: [
        { phase: "lint", code: "eslint(no-debugger)", file: "a.ts", line: 3, severity: "error" },
        { phase: "docs", code: "contract", file: "b.ts", severity: "warning" },
      ],
      data: {
        command: "stackra verify --format=json --keep-going",
        report: true,
        counts: { lint: { errors: 1, warnings: 0 }, docs: { errors: 0, warnings: 1 } },
      },
    });

    // Each distinct code is looked up once through `stackra explain`; only a listed one gets a link.
    expect(
      run.mock.calls.filter(([args]) => args[0] === "explain").map(([args]) => args[1]),
    ).toEqual(["shape_number_kind", "eslint(no-debugger)", "contract"]);
    expect(commandCalls(run)).toEqual([
      [
        [
          "new",
          "package",
          "loyalty-kit",
          "--category=data",
          "--description=--looks-like-a-flag",
          "--port=3700",
          "--dry-run",
        ],
        undefined,
      ],
      [["gen", "--check"], { cwd: join(root, "services/commerce") }],
      [["validate"], undefined],
      [["verify", "--format=json", "--keep-going"], undefined],
    ]);
    disconnect();
  });

  it("runs test, typecheck, lint and check in a member and reads their results", async () => {
    const outputs: Record<string, string> = {
      test: [
        " FAIL  src/a.test.ts > orders > cancels",
        "AssertionError: expected 1 to be 2",
        "",
        " Test Files  1 failed | 2 passed (3)",
        "      Tests  1 failed | 9 passed | 1 skipped (11)",
      ].join("\n"),
      typecheck:
        "src/a.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.\n",
      lint: "\n  ! eslint(no-debugger): `debugger` statement is not allowed\n   ,-[src/c.ts:3:1]\n",
      check: "[]\n",
    };
    const run = vi.fn<StackraRunner>(async (args) =>
      args[0] === "explain"
        ? explained(args[1])
        : {
            exitCode: args[0] === "check" || args[0] === "lint" ? 0 : 1,
            output: outputs[args[0] ?? ""] ?? "",
          },
    );
    const { client, disconnect } = start(run);

    const tested = await call(client, "test", { member: "commerce", tier: "int" });
    expect(tested.isError).toBe(true);
    expect(tested.structuredContent.diagnostics).toEqual([
      {
        phase: "test",
        severity: "error",
        file: "services/commerce/src/a.test.ts",
        message: "orders > cancels: AssertionError: expected 1 to be 2",
      },
    ]);
    expect(tested.structuredContent.data).toMatchObject({
      command: "stackra test --tier=int",
      cwd: "services/commerce",
      log: ".stackra/logs/last-test.log",
      tests: {
        files: { passed: 2, failed: 1, skipped: 0 },
        tests: { passed: 9, failed: 1, skipped: 1, todo: 0 },
        failures: [
          {
            file: "src/a.test.ts",
            test: "orders > cancels",
            message: "AssertionError: expected 1 to be 2",
          },
        ],
      },
    });

    // The full output is on disk; the result names it.
    expect(readFileSync(join(root, ".stackra/logs/last-test.log"), "utf8")).toBe(
      `$ stackra test --tier=int\n# in services/commerce\n${outputs["test"]}\n` +
        `# exit 1 after ${String(tested.structuredContent.data?.["durationMs"])} ms\n`,
    );

    const typed = await call(client, "typecheck", { member: "commerce" });
    expect(typed.structuredContent).toMatchObject({
      ok: false,
      diagnostics: [
        {
          phase: "typecheck",
          file: "services/commerce/src/a.ts",
          line: 2,
          column: 14,
          code: "TS2322",
          severity: "error",
        },
      ],
      data: { errors: 1, log: ".stackra/logs/last-typecheck.log" },
    });

    const linted = await call(client, "lint");
    expect(linted.isError).toBe(false);
    expect(linted.structuredContent).toMatchObject({
      ok: true,
      diagnostics: [
        {
          phase: "lint",
          file: "src/c.ts",
          line: 3,
          code: "eslint(no-debugger)",
          severity: "warning",
        },
      ],
      data: { cwd: ".", errors: 0, warnings: 1 },
    });

    const checked = await call(client, "check", { only: ["format", "lint"], withTests: true });
    expect(checked.structuredContent).toMatchObject({
      ok: true,
      diagnostics: [],
      data: {
        command: "stackra check --format=json --only=format,lint --with-tests",
        report: true,
        counts: {},
      },
    });

    expect(commandCalls(run).map(([args, at]) => [args, at?.cwd])).toEqual([
      [["test", "--tier=int"], join(root, "services/commerce")],
      [["typecheck"], join(root, "services/commerce")],
      [["lint"], undefined],
      [["check", "--format=json", "--only=format,lint", "--with-tests"], undefined],
    ]);
    disconnect();
  });

  it("returns a bad input as a tool error and runs nothing; an unknown tool is a protocol error", async () => {
    const run = vi.fn<StackraRunner>();
    const { client, disconnect } = start(run);

    for (const [name, args] of [
      ["new", { kind: "module", name: "x" }],
      ["new", { kind: "package", name: "--force" }],
      ["gen", { extra: 1 }],
      ["check", { only: ["lint", "deploy"] }],
      ["test", { tier: "load" }],
      ["test", { member: "billing" }],
    ] as const) {
      const refused = await call(client, name, args);
      expect(refused.isError, `${name} ${JSON.stringify(args)}`).toBe(true);
      expect(refused.structuredContent.ok).toBe(false);
      expect(refused.structuredContent.diagnostics).toEqual([
        expect.objectContaining({ phase: name, severity: "error", code: expect.any(String) }),
      ]);
    }
    await expect(client.request("tools/call", { name: "deploy" })).rejects.toMatchObject({
      code: -32_602,
    });
    await expect(
      client.request("tools/call", { name: "encore_call_endpoint" }),
    ).rejects.toMatchObject({ code: -32_602 });
    expect(run).not.toHaveBeenCalled();
    disconnect();
  });

  it("refuses a writing tool on a deployed target and still answers a read-only one", async () => {
    const run = vi.fn<StackraRunner>(async () => ({ exitCode: 0, output: "" }));
    const deployed = start(run, { env: { STACKRA_ENVIRONMENT: "production" } });

    const refused = await call(deployed.client, "gen");
    expect(refused).toMatchObject({
      isError: true,
      structuredContent: {
        ok: false,
        diagnostics: [
          {
            phase: "gen",
            code: "deployed_target",
            severity: "error",
            message:
              "gen writes, and the server runs in production (STACKRA_ENVIRONMENT): " +
              "the local developer MCP only writes in dev or test",
            fix: "run it from a local checkout, or through the deploy path for that environment",
          },
        ],
        error: {
          code: "deployed_target",
          message:
            "gen writes, and the server runs in production (STACKRA_ENVIRONMENT): " +
            "the local developer MCP only writes in dev or test",
        },
      },
    });
    expect((await call(deployed.client, "manifest", { member: "web" })).isError).toBe(false);
    expect((await call(deployed.client, "validate")).isError).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toEqual(["validate"]);
    deployed.disconnect();

    // A local server still refuses a host tool call that names a deployed environment.
    const invoke = vi.fn<LocalTool["invoke"]>(async () => ({
      document: { ok: true },
      exitCode: 0,
    }));
    const settings: LocalTool = {
      name: "settings_apply",
      description: "Apply settings",
      inputSchema: { type: "object" },
      readOnly: false,
      invoke,
    };
    const local = start(vi.fn<StackraRunner>(), {
      tools: [settings],
      env: { STACKRA_ENVIRONMENT: "dev" },
    });
    expect(await call(local.client, "settings_apply", { env: "staging" })).toMatchObject({
      isError: true,
      structuredContent: { error: { code: "deployed_target" } },
    });
    expect(await call(local.client, "settings_apply", { env: "dev" })).toMatchObject({
      isError: false,
    });
    expect(invoke).toHaveBeenCalledTimes(1);
    local.disconnect();
  });

  it("proxies every page of Encore tools under encore_, forwards calls unprefixed, and guards its writes", async () => {
    const encore = encorePeer([
      {
        tools: [
          {
            name: "call_endpoint",
            description: "Call an endpoint",
            inputSchema: { type: "object" },
          },
        ],
        nextCursor: "1",
      },
      {
        tools: [
          {
            name: "get_traces",
            description: "Read traces",
            inputSchema: { type: "object" },
            annotations: { readOnlyHint: true },
          },
        ],
      },
    ]);

    const { client, served, disconnect } = start(vi.fn<StackraRunner>(), {
      encore: encore.peer,
      env: { STACKRA_ENVIRONMENT: "staging" },
    });
    const { tools } = (await client.request("tools/list")) as { tools: { name: string }[] };
    expect(tools.slice(-2)).toEqual([
      {
        name: "encore_call_endpoint",
        description: "Call an endpoint",
        inputSchema: { type: "object" },
      },
      {
        name: "encore_get_traces",
        description: "Read traces",
        inputSchema: { type: "object" },
        annotations: { readOnlyHint: true },
      },
    ]);
    expect(encore.listed).toEqual([{}, { cursor: "1" }]);

    const traces = (await client.request("tools/call", {
      name: "encore_get_traces",
      arguments: { service: "commerce" },
    })) as { content: { text: string }[] };
    expect(JSON.parse(traces.content[0]?.text ?? "")).toEqual({
      name: "get_traces",
      arguments: { service: "commerce" },
    });
    // Encore does not say call_endpoint is read-only, so a deployed server refuses it.
    expect(await call(client, "encore_call_endpoint", { service: "commerce" })).toMatchObject({
      isError: true,
      structuredContent: { error: { code: "deployed_target" } },
    });

    disconnect();
    await served;
    await expect(encore.peer.closed).resolves.toBeUndefined();
  });

  it("serves host tools with their own schema and handler, replacing a built-in of the same name", async () => {
    const doctor: LocalTool = {
      name: "validate",
      description: "Check the machine",
      inputSchema: {
        type: "object",
        properties: { quick: { type: "boolean" } },
        additionalProperties: false,
      },
      readOnly: true,
      invoke: async (input) => ({
        document: { ok: false, data: [{ name: "git", status: "fail", input }] },
        exitCode: 1,
      }),
    };
    const run = vi.fn<StackraRunner>();
    const { client, served, disconnect } = start(run, { tools: [doctor] });

    const { tools } = (await client.request("tools/list")) as {
      tools: { name: string; description: string; annotations: unknown }[];
    };
    expect(tools.filter((tool) => tool.name === "validate")).toEqual([
      expect.objectContaining({
        description: "Check the machine",
        annotations: { readOnlyHint: true },
      }),
    ]);
    expect(tools.findIndex((tool) => tool.name === "validate")).toBe(5);
    const result = await client.request("tools/call", {
      name: "validate",
      arguments: { quick: true },
    });
    expect(result).toMatchObject({
      structuredContent: {
        ok: false,
        data: [{ name: "git", status: "fail", input: { quick: true } }],
      },
      isError: true,
    });
    expect(run).not.toHaveBeenCalled();

    disconnect();
    await served;
  });
});
