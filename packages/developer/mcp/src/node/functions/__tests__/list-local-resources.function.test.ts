/**
 * Stackra file contract:
 * Purpose: unit tests of `listLocalResources`: the list holds the guidelines, every manifest, one entry per committed
 *          manifest, rule and skill (other document kinds left out), and every listed URI reads; a member key is
 *          URI-encoded; manifests are read again on every call, and one that is not JSON leaves the members out.
 * Boundary: test only; in-memory documents and a throwaway repository in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); STA-2919.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import type { AgentDocument } from "@stackra/skills";

import { listLocalResources } from "#node/functions/list-local-resources.function";
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

describe("listLocalResources", () => {
  it("lists the guidelines, the manifests, the rules and the skills, and every one reads", () => {
    const resources = listLocalResources(knowledge);

    expect(resources.map((resource) => [resource.uri, resource.mimeType])).toEqual([
      ["stackra://guidelines", "text/markdown"],
      ["stackra://manifest", "application/json"],
      ["stackra://manifest/commerce", "application/json"],
      ["stackra://rules/naming", "text/markdown"],
      ["stackra://rules/tenancy", "text/markdown"],
      ["stackra://skills/backend-errors", "text/markdown"],
    ]);
    expect(resources[3]?.description).toContain("Always applies");
    expect(resources[4]?.description).toBe("Tenant isolation.");
    for (const resource of resources)
      expect(readLocalResource(knowledge, resource.uri)).toMatchObject({
        uri: resource.uri,
        mimeType: resource.mimeType,
      });
  });

  it("follows the manifests on disk and leaves members out when one is not JSON", () => {
    writeManifest("loyalty kit");
    expect(listLocalResources(knowledge).map((resource) => resource.uri)).toContain(
      "stackra://manifest/loyalty%20kit",
    );

    writeManifest("broken", "{ not json");
    expect(
      listLocalResources(knowledge).filter((resource) =>
        resource.uri.startsWith("stackra://manifest/"),
      ),
    ).toEqual([]);
  });
});
