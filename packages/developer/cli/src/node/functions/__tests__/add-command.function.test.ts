/**
 * Stackra file contract:
 * Purpose: unit tests of `addCommand` over a fake catalogue client: a skill, an agent, an MCP server and a plugin
 *          install into their ADR 0453 targets and are pinned in `stackra-items.lock.yaml`; `@stackra` is tried
 *          before `@stackra-pro`; dist-tags resolve; an unknown item, a wrong kind, an unknown version and a
 *          hand-written target of the same name are refused; usage errors throw `CliUsageError`.
 * Boundary: test only; writes a throwaway workspace in the OS temp directory and never reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 11).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import type { CatalogueItem, StackraManifest } from "@stackra/skills/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { addCommand } from "#node/functions/add-command.function";
import { captureIo } from "#node/functions/capture-io.function";
import type { CatalogueClient } from "#node/types/catalogue-client.type";
import type { RegistryAccess } from "#node/types/registry-access.type";

const encoder = new TextEncoder();
const tgz = (files: Record<string, string>) => {
  const blocks: Uint8Array[] = [];
  for (const [name, body] of Object.entries(files)) {
    const header = new Uint8Array(512);
    header.set(encoder.encode(`package/${name}`), 0);
    header.set(encoder.encode(`${body.length.toString(8).padStart(11, "0")}\0`), 124);
    header.set(encoder.encode("0"), 156);
    const data = new Uint8Array(Math.ceil(body.length / 512) * 512);
    data.set(encoder.encode(body));
    blocks.push(header, data);
  }
  return gzipSync(Buffer.concat([...blocks, new Uint8Array(1024)]));
};

const catalogueItem = (name: string, stackra: StackraManifest): CatalogueItem => ({
  name,
  scope: name.split("/")[0] ?? "",
  kind: stackra.kind,
  description: null,
  latest: "0.2.0",
  distTags: { latest: "0.2.0", canary: "0.3.0-canary.1" },
  access: name.startsWith("@stackra-pro/") ? "licensed" : "open",
  licence: "MIT",
  keywords: [],
  repository: null,
  homepage: null,
  publishedAt: "2026-10-27T00:00:00.000Z",
  deprecated: null,
  stackra,
  versions: ["0.1.0", "0.2.0", "0.3.0-canary.1"],
});

/** A fake registry: the items it holds and the tarball files of each; records every call with all its arguments. */
const fakeClient = (
  items: Record<string, { stackra: StackraManifest; files: Record<string, string> }>,
) => {
  const calls: { readonly method: string; readonly args: readonly unknown[] }[] = [];
  const accesses: RegistryAccess[] = [];
  const client: CatalogueClient = {
    async item(...args) {
      calls.push({ method: "item", args });
      const found = items[args[0]];
      return found === undefined ? null : catalogueItem(args[0], found.stackra);
    },
    async tarball(...args) {
      calls.push({ method: "tarball", args });
      const found = items[args[0]];
      if (found === undefined) throw new Error("no such tarball");
      const files = {
        "package.json": JSON.stringify({ name: args[0], version: args[1], stackra: found.stackra }),
        ...found.files,
      };
      return { bytes: tgz(files), integrity: "sha512-AAAA" };
    },
  };
  return {
    calls,
    accesses,
    create: (access: RegistryAccess) => {
      accesses.push(access);
      return client;
    },
  };
};

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-add-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const add = async (fake: ReturnType<typeof fakeClient>, positionals: string[]) => {
  const { io, output } = captureIo();
  const code = await addCommand(fake.create).run({
    cwd: root,
    io,
    values: {},
    positionals,
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};
const lock = () => parse(readFileSync(join(root, "stackra-items.lock.yaml"), "utf8"));

describe("addCommand", () => {
  it("installs a skill folder and pins it in the lock", async () => {
    const fake = fakeClient({
      "@stackra/skill-archify": {
        stackra: { kind: "skill" },
        files: { "SKILL.md": "# Archify", "references/guide.md": "guide" },
      },
    });
    const { code, output } = await add(fake, ["skill", "archify"]);
    expect(code).toBe(0);
    expect(output).toContain("added @stackra/skill-archify@0.2.0 to .agents/skills/archify");
    expect(readFileSync(join(root, ".agents/skills/archify/SKILL.md"), "utf8")).toBe("# Archify");
    expect(readFileSync(join(root, ".agents/skills/archify/references/guide.md"), "utf8")).toBe(
      "guide",
    );
    expect(lock()).toEqual({
      lockfileVersion: 1,
      items: {
        "@stackra/skill-archify": {
          kind: "skill",
          version: "0.2.0",
          integrity: "sha512-AAAA",
          target: ".agents/skills/archify",
        },
      },
    });
    expect(fake.accesses).toEqual([
      { origin: "https://npm.stackra.figentra.com/", token: undefined },
    ]);
    expect(fake.calls).toEqual([
      { method: "item", args: ["@stackra/skill-archify"] },
      { method: "tarball", args: ["@stackra/skill-archify", "0.2.0"] },
    ]);
  });

  it("falls back to @stackra-pro, resolves a dist-tag and installs an agent file", async () => {
    const fake = fakeClient({
      "@stackra-pro/agent-reviewer": {
        stackra: { kind: "agent" },
        files: { "agent.md": "# Reviewer" },
      },
    });
    const { code } = await add(fake, ["agent", "reviewer@canary"]);
    expect(code).toBe(0);
    expect(fake.calls.map((call) => call.args)).toEqual([
      ["@stackra/agent-reviewer"],
      ["@stackra-pro/agent-reviewer"],
      ["@stackra-pro/agent-reviewer", "0.3.0-canary.1"],
    ]);
    expect(readFileSync(join(root, ".agents/agents/reviewer.md"), "utf8")).toBe("# Reviewer");
    expect(lock().items["@stackra-pro/agent-reviewer"].target).toBe(".agents/agents/reviewer.md");
  });

  it("adds an MCP server entry to .mcp.yaml and keeps its comments", async () => {
    writeFileSync(join(root, ".mcp.yaml"), "# servers\nmcpServers:\n  other:\n    command: npx\n");
    const entry = { command: "npx", args: ["-y", "@stackra/mcp-github@0.2.0"] };
    const fake = fakeClient({
      "@stackra/mcp-github": { stackra: { kind: "mcp", mcp: entry }, files: {} },
    });
    const { code, output } = await add(fake, ["mcp", "github"]);
    expect(code).toBe(0);
    expect(output).toContain("stackra mcp sync");
    const text = readFileSync(join(root, ".mcp.yaml"), "utf8");
    expect(text.startsWith("# servers\n")).toBe(true);
    expect(parse(text).mcpServers).toEqual({ other: { command: "npx" }, github: entry });
    expect(lock().items["@stackra/mcp-github"].target).toBe(".mcp.yaml#mcpServers.github");
  });

  it("installs a plugin folder and replaces it on a second add", async () => {
    const fake = fakeClient({
      "@stackra/plugin-review": { stackra: { kind: "plugin" }, files: { "plugin.json": "{}" } },
    });
    expect((await add(fake, ["plugin", "review@0.1.0"])).code).toBe(0);
    writeFileSync(join(root, ".agents/plugins/review/stale.txt"), "old");
    expect((await add(fake, ["plugin", "review"])).code).toBe(0);
    expect(readFileSync(join(root, ".agents/plugins/review/plugin.json"), "utf8")).toBe("{}");
    expect(() => readFileSync(join(root, ".agents/plugins/review/stale.txt"))).toThrow();
    expect(lock().items["@stackra/plugin-review"].version).toBe("0.2.0");
  });

  it("refuses a hand-written target of the same name", async () => {
    mkdirSync(join(root, ".agents/skills/archify"), { recursive: true });
    writeFileSync(join(root, ".agents/skills/archify/SKILL.md"), "mine");
    const fake = fakeClient({
      "@stackra/skill-archify": { stackra: { kind: "skill" }, files: { "SKILL.md": "theirs" } },
    });
    await expect(add(fake, ["skill", "archify"])).rejects.toThrow(/not in the items lock/);
    expect(readFileSync(join(root, ".agents/skills/archify/SKILL.md"), "utf8")).toBe("mine");
  });

  it("refuses an unknown item, an unknown version and a skill without SKILL.md", async () => {
    const fake = fakeClient({
      "@stackra/skill-empty": { stackra: { kind: "skill" }, files: { "README.md": "x" } },
    });
    expect(await add(fake, ["skill", "missing"])).toMatchObject({ code: 1 });
    expect(await add(fake, ["skill", "empty@9.9.9"])).toMatchObject({ code: 1 });
    await expect(add(fake, ["skill", "empty"])).rejects.toThrow(/no SKILL.md/);
  });

  it("refuses a bad command line", async () => {
    const fake = fakeClient({});
    await expect(add(fake, ["theme", "x"])).rejects.toThrow(CliUsageError);
    await expect(add(fake, ["skill", "Bad_Name"])).rejects.toThrow(CliUsageError);
    await expect(add(fake, ["skill", "a", "b"])).rejects.toThrow(CliUsageError);
  });
});
