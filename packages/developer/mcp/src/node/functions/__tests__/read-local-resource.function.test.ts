/**
 * Stackra file contract:
 * Purpose: unit tests of `readLocalResource`: every manifest, one member's manifest (its key URI-decoded), a document
 *          body and the guidelines read; an unknown URI, member or name, or a name of the wrong kind, answers -32002
 *          with the URI; a manifest that is not JSON answers -32603 naming the cause.
 * Boundary: test only; in-memory documents and a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2919.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import type { AgentDocument } from "@stackra/skills";

import { readLocalResource } from "#node/functions/read-local-resource.function";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";

const DOCUMENTS: readonly AgentDocument[] = [
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
    kind: "rule",
    name: "tenancy",
    title: "Tenancy",
    description: "Tenant isolation.",
    always: false,
    globs: [],
    body: "# Tenancy\n\nEvery query runs in withTenant.\n",
    source: "rules/tenancy.md",
  },
  {
    kind: "skill",
    name: "backend-errors",
    description: "Raise errors the Stackra way.",
    body: "# Errors\n\nRefusal codes are snake_case.\n",
    source: "skills/backend-errors/SKILL.md",
  },
  {
    kind: "command",
    name: "ship",
    description: "Not served.",
    body: "Ship it.",
    source: "commands/ship.md",
  } as unknown as AgentDocument,
];

let root: string;
let knowledge: LocalKnowledge;

/** Writes the manifest of `member` under `services/`. */
const writeManifest = (
  member: string,
  body: string = JSON.stringify({ member, package: `@acme/${member}`, version: "1" }),
) => {
  mkdirSync(join(root, "services", member), { recursive: true });
  writeFileSync(join(root, "services", member, "stackra.manifest.json"), body);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-resources-"));
  writeManifest("commerce");
  knowledge = { root, documents: DOCUMENTS, tools: new Set(["gen", "verify"]) };
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("readLocalResource", () => {
  it("reads every manifest, one member's manifest and a document body", () => {
    expect(JSON.parse(readLocalResource(knowledge, "stackra://manifest").text)).toEqual([
      { member: "commerce", package: "@acme/commerce", version: "1" },
    ]);
    expect(JSON.parse(readLocalResource(knowledge, "stackra://manifest/commerce").text)).toEqual({
      member: "commerce",
      package: "@acme/commerce",
      version: "1",
    });
    expect(readLocalResource(knowledge, "stackra://skills/backend-errors").text).toBe(
      "# Errors\n\nRefusal codes are snake_case.\n",
    );
    expect(readLocalResource(knowledge, "stackra://guidelines").text).toContain(
      "## Naming\n\nUse whole words.",
    );
  });

  it("decodes a URI-encoded member key", () => {
    writeManifest("loyalty kit");
    expect(
      JSON.parse(readLocalResource(knowledge, "stackra://manifest/loyalty%20kit").text),
    ).toMatchObject({ member: "loyalty kit" });
  });

  it.each([
    "stackra://nothing",
    "file:///etc/passwd",
    "stackra://manifest/billing",
    "stackra://manifest/%E0%A4%A",
    "stackra://rules/backend-errors",
    "stackra://skills/naming",
    "stackra://skills/ship",
  ])("answers resource not found for %s", (uri) => {
    expect(() => readLocalResource(knowledge, uri)).toThrow(
      expect.objectContaining({ code: -32_002, message: `Resource not found: ${uri}` }),
    );
  });

  it("names the cause when a manifest is not JSON", () => {
    writeManifest("broken", "{ not json");
    expect(() => readLocalResource(knowledge, "stackra://manifest")).toThrow(
      expect.objectContaining({
        code: -32_603,
        message: expect.stringContaining("A stackra.manifest.json cannot be read"),
      }),
    );
  });
});
