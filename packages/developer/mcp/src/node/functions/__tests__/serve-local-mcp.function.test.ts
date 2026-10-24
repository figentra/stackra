/**
 * Stackra file contract:
 * Purpose: unit tests of `serveLocalMcp`: the handshake answers the client's protocol revision; `tools/list` holds the
 *          local tools and the Encore tools under `encore_`; `manifest` reads the committed manifests; `new`, `gen`,
 *          `validate` and `verify` run through the given CLI runner (the CLI's gates), with a failing exit marked as
 *          an error; invalid arguments are refused before anything runs; an Encore call is forwarded unprefixed; the
 *          server resolves when the client disconnects.
 * Boundary: test only; in-memory streams, a fake runner, a fake Encore peer and a throwaway repository in the OS temp
 *           directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5 and enforcement); R-29.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { connectMcp } from "#node/functions/connect-mcp.function";
import { serveLocalMcp } from "#node/functions/serve-local-mcp.function";
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

/** A started server with a client peer; `encore` is the upstream peer or `null`. */
function start(run: StackraRunner, encore: McpPeer | null = null) {
  const toServer = new PassThrough();
  const toClient = new PassThrough();
  const served = serveLocalMcp({
    version: "1.2.3",
    root,
    input: toServer,
    output: toClient,
    run,
    encore,
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
      capabilities: { tools: {} },
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

    await expect(client.request("resources/list")).rejects.toMatchObject({ code: -32601 });
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
      code: -32602,
    });
    await expect(
      client.request("tools/call", { name: "gen", arguments: { extra: 1 } }),
    ).rejects.toMatchObject({ code: -32602 });
    await expect(client.request("tools/call", { name: "deploy" })).rejects.toMatchObject({
      code: -32602,
    });
    await expect(
      client.request("tools/call", { name: "encore_call_endpoint" }),
    ).rejects.toMatchObject({ code: -32602 });
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
});
