/**
 * Stackra file contract:
 * Purpose: unit tests of `serveLocalMcp`: the handshake answers the client's protocol revision; `tools/list` holds the
 *          local tools and the Encore tools under `encore_`; `manifest` reads the committed manifests; `new`, `gen`,
 *          `validate` and `verify` run through the given CLI runner (the CLI's gates), with a failing exit marked as
 *          an error; invalid arguments are refused before anything runs; an Encore call is forwarded unprefixed; the
 *          server resolves when the client disconnects; command tools (STA-1966) are served with their own schema and
 *          handler, their `--json` document as the structured result; resources (`stackra://guidelines`, the manifests,
 *          the rules and skills) and prompts (`add-feature`, `fix-gen-drift`, `explain-refusal`) answer over the
 *          protocol, with the MCP error codes for an unknown URI, prompt or argument (STA-2919).
 * Boundary: test only; in-memory streams, a fake runner, a fake Encore peer and a throwaway repository in the OS temp
 *           directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5 and enforcement); R-29; STA-2919.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import type { AgentDocument } from "@stackra/skills";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MCP_PROTOCOL_VERSIONS } from "#node/constants/mcp-protocol-versions.constant";
import { connectMcp } from "#node/functions/connect-mcp.function";
import { serveLocalMcp } from "#node/functions/serve-local-mcp.function";
import type { LocalTool } from "#node/types/local-tool.type";
import type { McpPeer } from "#node/types/mcp-peer.type";
import type { StackraRunner } from "#node/types/stackra-runner.type";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
  mkdirSync(join(root, "services", "commerce"), { recursive: true });
  writeFileSync(
    join(root, "services", "commerce", "stackra.manifest.json"),
    JSON.stringify({
      member: "commerce",
      package: "@acme/service-commerce",
      version: "1",
      actions: [{ key: "orders.order.cancel@1" }],
    }),
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The agent documents the resources and prompts serve in these tests. */
const SKILLS: readonly AgentDocument[] = [
  {
    kind: "rule",
    name: "naming",
    title: "Naming",
    description: "How to name things.",
    always: true,
    globs: [],
    body: "# Naming\n\nUse whole words.\n",
    source: "rules/naming.md",
  },
  {
    kind: "skill",
    name: "backend-errors",
    description: "Raise errors the Stackra way.",
    body: "# Errors\n\nRefusal codes are snake_case.\n",
    source: "skills/backend-errors/SKILL.md",
  },
];

/** A started server and its client; `encore` is the upstream peer or `null`, `skills` `null` keeps the default. */
function start(
  run: StackraRunner,
  encore: McpPeer | null = null,
  tools: readonly LocalTool[] = [],
  skills: readonly AgentDocument[] | null = SKILLS,
) {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  const served = serveLocalMcp({
    version: "1.2.3",
    root,
    input: toServer,
    output: toClient,
    run,
    encore,
    tools,
    ...(skills === null ? {} : { skills }),
  });
  const client = connectMcp(toClient, toServer);
  return { client, served, disconnect: () => toServer.end() };
}

/** The text of a tool result. */
const textOf = (result: unknown): string =>
  (result as { content: { text: string }[] }).content[0]?.text ?? "";

describe("serveLocalMcp", () => {
  it("answers the handshake and lists the local tools", async () => {
    const { client, served, disconnect } = start(vi.fn<StackraRunner>());

    await expect(
      client.request("initialize", { protocolVersion: "2025-06-18", capabilities: {} }),
    ).resolves.toEqual({
      protocolVersion: "2025-06-18",
      capabilities: { tools: {}, resources: {}, prompts: {} },
      serverInfo: { name: "stackra", version: "1.2.3" },
    });
    await expect(
      client.request("initialize", { protocolVersion: "1999-01-01" }),
    ).resolves.toMatchObject({
      protocolVersion: "2025-11-25",
    });
    await expect(client.request("ping")).resolves.toEqual({});

    const { tools } = (await client.request("tools/list")) as {
      tools: { name: string; inputSchema: object }[];
    };
    expect(tools.map((tool) => tool.name)).toEqual([
      "manifest",
      "new",
      "gen",
      "validate",
      "verify",
    ]);
    expect(tools[1]?.inputSchema).toMatchObject({ type: "object", required: ["kind", "name"] });

    await expect(client.request("completion/complete")).rejects.toMatchObject({ code: -32_601 });
    disconnect();
    await expect(served).resolves.toBeUndefined();
  });

  it("reads manifests, filtered by member and narrowed to a section", async () => {
    const { client, disconnect } = start(vi.fn<StackraRunner>());

    const all = await client.request("tools/call", { name: "manifest", arguments: {} });
    expect(JSON.parse(textOf(all))).toEqual([expect.objectContaining({ member: "commerce" })]);

    const actions = await client.request("tools/call", {
      name: "manifest",
      arguments: { member: "commerce", section: "actions" },
    });
    expect(JSON.parse(textOf(actions))).toEqual([
      { member: "commerce", actions: [{ key: "orders.order.cancel@1" }] },
    ]);

    const missing = await client.request("tools/call", {
      name: "manifest",
      arguments: { member: "billing" },
    });
    expect(missing).toMatchObject({ isError: true });
    disconnect();
  });

  it("runs every write and gate through the CLI runner", async () => {
    const run = vi.fn<StackraRunner>(async (args) =>
      args[0] === "verify"
        ? { exitCode: 1, output: "lint failed\n" }
        : { exitCode: 0, output: "ok\n" },
    );
    const { client, disconnect } = start(run);

    const created = await client.request("tools/call", {
      name: "new",
      arguments: { kind: "package", name: "loyalty-kit", flags: ["--category", "data"] },
    });
    expect(created).toMatchObject({ isError: false });
    expect(textOf(created)).toBe("$ stackra new package loyalty-kit --category data\nok\n\nexit 0");

    await client.request("tools/call", { name: "gen", arguments: { check: true } });
    await client.request("tools/call", { name: "validate" });
    const verified = await client.request("tools/call", { name: "verify", arguments: {} });
    expect(verified).toMatchObject({ isError: true });
    expect(textOf(verified)).toContain("lint failed");

    expect(run.mock.calls.map(([args]) => args)).toEqual([
      ["new", "package", "loyalty-kit", "--category", "data"],
      ["gen", "--check"],
      ["validate"],
      ["verify"],
    ]);
    disconnect();
  });

  it("refuses invalid arguments and unknown tools before running anything", async () => {
    const run = vi.fn<StackraRunner>();
    const { client, disconnect } = start(run);

    await expect(
      client.request("tools/call", { name: "new", arguments: { kind: "--force", name: "x" } }),
    ).rejects.toMatchObject({
      code: -32_602,
    });
    await expect(
      client.request("tools/call", { name: "gen", arguments: { extra: 1 } }),
    ).rejects.toMatchObject({ code: -32_602 });
    await expect(client.request("tools/call", { name: "deploy" })).rejects.toMatchObject({
      code: -32_602,
    });
    await expect(
      client.request("tools/call", { name: "encore_call_endpoint" }),
    ).rejects.toMatchObject({ code: -32_602 });
    expect(run).not.toHaveBeenCalled();
    disconnect();
  });

  it("proxies the Encore tools under encore_ and forwards calls unprefixed", async () => {
    const upstreamHandle = vi.fn(async (method: string, params: unknown) =>
      method === "tools/list"
        ? {
            tools: [
              {
                name: "call_endpoint",
                description: "Call an endpoint",
                inputSchema: { type: "object" },
              },
            ],
          }
        : { content: [{ type: "text", text: JSON.stringify(params) }] },
    );
    const toEncore = new PassThrough();
    const fromEncore = new PassThrough();
    connectMcp(toEncore, fromEncore, upstreamHandle);
    const encore = connectMcp(fromEncore, toEncore);

    const { client, served, disconnect } = start(vi.fn<StackraRunner>(), encore);
    const { tools } = (await client.request("tools/list")) as { tools: { name: string }[] };
    expect(tools.at(-1)).toEqual({
      name: "encore_call_endpoint",
      description: "Call an endpoint",
      inputSchema: { type: "object" },
    });

    const called = await client.request("tools/call", {
      name: "encore_call_endpoint",
      arguments: { service: "commerce" },
    });
    expect(JSON.parse(textOf(called))).toEqual({
      name: "call_endpoint",
      arguments: { service: "commerce" },
    });

    disconnect();
    await served;
    await expect(encore.closed).resolves.toBeUndefined();
  });

  it("serves command tools with their own schema and handler, replacing a built-in of the same name", async () => {
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
    const { client, served, disconnect } = start(run, null, [doctor]);

    const { tools } = (await client.request("tools/list")) as {
      tools: { name: string; description: string; annotations: unknown }[];
    };
    expect(tools.filter((tool) => tool.name === "validate")).toEqual([
      expect.objectContaining({
        description: "Check the machine",
        annotations: { readOnlyHint: true },
      }),
    ]);
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

  // P-005: whatever revision a client asks for, the three capabilities are advertised and each one's list answers.
  it("advertises tools, resources and prompts for every revision, and each capability's list method answers", async () => {
    const { client, served, disconnect } = start(vi.fn<StackraRunner>());
    const lists: Record<string, readonly string[]> = {
      tools: ["tools/list"],
      resources: ["resources/list", "resources/templates/list"],
      prompts: ["prompts/list"],
    };

    for (const protocolVersion of [...MCP_PROTOCOL_VERSIONS, "1999-01-01"]) {
      const { capabilities } = (await client.request("initialize", {
        protocolVersion,
        capabilities: {},
      })) as { capabilities: Record<string, object> };
      expect(Object.keys(capabilities).toSorted(), protocolVersion).toEqual([
        "prompts",
        "resources",
        "tools",
      ]);
      for (const capability of Object.keys(capabilities)) {
        for (const method of lists[capability] ?? []) {
          await expect(client.request(method), method).resolves.toBeTypeOf("object");
        }
      }
    }

    disconnect();
    await served;
  });

  it("serves the guidelines, the manifests, the rules and the skills as resources", async () => {
    const { client, served, disconnect } = start(vi.fn<StackraRunner>());

    const { resources } = (await client.request("resources/list")) as {
      resources: { uri: string; name: string; mimeType: string }[];
    };
    expect(resources.map((resource) => resource.uri)).toEqual([
      "stackra://guidelines",
      "stackra://manifest",
      "stackra://manifest/commerce",
      "stackra://rules/naming",
      "stackra://skills/backend-errors",
    ]);
    const { resourceTemplates } = (await client.request("resources/templates/list")) as {
      resourceTemplates: { uriTemplate: string }[];
    };
    expect(resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      "stackra://manifest/{member}",
      "stackra://rules/{name}",
      "stackra://skills/{name}",
    ]);

    const guidelines = (await client.request("resources/read", {
      uri: "stackra://guidelines",
    })) as { contents: { uri: string; mimeType: string; text: string }[] };
    expect(guidelines.contents).toEqual([
      {
        uri: "stackra://guidelines",
        mimeType: "text/markdown",
        text: expect.stringContaining("## Naming\n\nUse whole words."),
      },
    ]);
    expect(guidelines.contents[0]?.text).toContain("`stackra://skills/backend-errors` (skill)");
    // The tool list decides how the tests run: no `test` tool here, so `verify`.
    expect(guidelines.contents[0]?.text).toContain("the tests with the `verify` tool");

    const manifest = (await client.request("resources/read", {
      uri: "stackra://manifest/commerce",
    })) as { contents: { text: string }[] };
    expect(JSON.parse(manifest.contents[0]?.text ?? "")).toMatchObject({
      member: "commerce",
      actions: [{ key: "orders.order.cancel@1" }],
    });

    await expect(
      client.request("resources/read", { uri: "stackra://manifest/billing" }),
    ).rejects.toMatchObject({
      code: -32_002,
      message: "Resource not found: stackra://manifest/billing",
    });
    await expect(client.request("resources/read", {})).rejects.toMatchObject({ code: -32_602 });

    disconnect();
    await served;
  });

  it("serves the recipes as prompts, each ending with gen --check and the tests", async () => {
    const test: LocalTool = {
      name: "test",
      description: "Run the tests",
      inputSchema: { type: "object" },
      readOnly: true,
      invoke: async () => ({ document: { ok: true }, exitCode: 0 }),
    };
    const { client, served, disconnect } = start(vi.fn<StackraRunner>(), null, [test]);

    const { prompts } = (await client.request("prompts/list")) as {
      prompts: { name: string; title: string; arguments: { name: string; required: boolean }[] }[];
    };
    expect(
      prompts.map((prompt) => [prompt.name, prompt.arguments.map((argument) => argument.name)]),
    ).toEqual([
      ["add-feature", ["feature", "member"]],
      ["fix-gen-drift", ["output"]],
      ["explain-refusal", ["code", "message"]],
    ]);

    const got = (await client.request("prompts/get", {
      name: "add-feature",
      arguments: { feature: "Refund an order", member: "commerce" },
    })) as {
      description: string;
      messages: { role: string; content: { type: string; text?: string } }[];
    };
    expect(got.messages.map((message) => [message.role, message.content.type])).toEqual([
      ["user", "text"],
      ["user", "resource"],
    ]);
    expect(got.messages[0]?.content.text).toContain("2. Run `stackra gen --check`");
    // A `test` command tool is served, so the recipe runs the tests through it.
    expect(got.messages[0]?.content.text).toContain("3. Run the tests with the `test` tool.");

    await expect(client.request("prompts/get", { name: "deploy" })).rejects.toMatchObject({
      code: -32_602,
      message: "Unknown prompt: deploy",
    });
    await expect(
      client.request("prompts/get", { name: "explain-refusal", arguments: {} }),
    ).rejects.toMatchObject({ code: -32_602 });
    await expect(client.request("prompts/get", {})).rejects.toMatchObject({ code: -32_602 });

    disconnect();
    await served;
  });

  it("serves the conventions @stackra/skills ships when no skills are given", async () => {
    const { client, served, disconnect } = start(vi.fn<StackraRunner>(), null, [], null);

    const { resources } = (await client.request("resources/list")) as {
      resources: { uri: string }[];
    };
    expect(resources.map((resource) => resource.uri)).toEqual(
      expect.arrayContaining([
        "stackra://rules/naming-and-casing",
        "stackra://skills/backend-errors",
        "stackra://skills/backend-author-an-action",
      ]),
    );
    const read = (await client.request("resources/read", {
      uri: "stackra://skills/backend-errors",
    })) as { contents: { text: string }[] };
    expect(read.contents[0]?.text).toContain("Refusal codes");

    disconnect();
    await served;
  });
});
