/**
 * Stackra file contract:
 * Purpose: unit tests of `loadSkillSet`: the bundled set parses and holds only open (layer 1) conventions, a custom
 *          root loads every kind in a stable order and skips READMEs and stray files, and a missing root, a skill
 *          folder without `SKILL.md` and an invalid document each throw.
 * Boundary: test only; writes into fresh temporary folders.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 2, 4, 6 and 7, and enforcement).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
import { loadSkillSet } from "#node/functions/load-skill-set.function";

/** A fresh root holding `files` (relative path to text). */
const rootWith = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "stackra-skills-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
};

describe("loadSkillSet", () => {
  it("loads the bundled conventions", () => {
    const documents = loadSkillSet();
    const names = (kind: string): string[] =>
      documents.filter((document) => document.kind === kind).map((document) => document.name);

    expect(names("skill")).toEqual(
      expect.arrayContaining(["code-naming-and-casing", "backend-author-an-action"]),
    );
    expect(names("rule")).toEqual(
      expect.arrayContaining(["naming-and-casing", "module-boundary", "not-built-yet"]),
    );
    expect(Object.isFrozen(documents)).toBe(true);
  });

  it("ships no Figentra-internal operation in the bundled set (ADR 0282 decisions 4 and 7)", () => {
    const internal =
      /pnpm (?:linear|delegate|bot:|secrets:import|pr:merge|ai:spend)|Secrets-inbox|\.notes\//;

    for (const document of loadSkillSet()) {
      expect(internal.test(document.body), document.source).toBe(false);
    }
  });

  it("loads every kind from a custom root, in kind order and sorted by name", () => {
    const root = rootWith({
      "hooks/guard-bash.md": "---\ndescription: Guard\nevent: pre_tool_use\nrun: guard\n---\n",
      "rules/b-rule.md": "---\ntitle: B\ndescription: B\n---\n",
      "rules/a-rule.md": "---\ntitle: A\ndescription: A\n---\n",
      "rules/README.md": "# Not a rule",
      "rules/notes.txt": "skip",
      "skills/tdd/SKILL.md": "---\ndescription: Test first\n---\n",
      "skills/tdd/references/mocking.md": "# Supporting file",
      "skills/README.md": "# Not a skill",
      "subagents/reviewer.md": "---\ndescription: Reviews\n---\n",
      "commands/spec.md": "---\ndescription: Spec\n---\n",
    });

    expect(loadSkillSet(root).map((document) => `${document.kind}:${document.name}`)).toEqual([
      "skill:tdd",
      "rule:a-rule",
      "rule:b-rule",
      "subagent:reviewer",
      "command:spec",
      "hook:guard-bash",
    ]);
    expect(loadSkillSet(root)[0]?.source).toBe(join(root, "skills", "tdd", "SKILL.md"));
  });

  it("returns nothing for an empty root", () => {
    expect(loadSkillSet(rootWith({}))).toEqual([]);
  });

  it("throws when the root is not a folder", () => {
    const missing = join(tmpdir(), "stackra-skills-missing-root");

    expect(() => loadSkillSet(missing)).toThrow(
      new AgentDocumentInvalidError(missing, [{ path: "", message: "Not a folder" }]),
    );
  });

  it("throws on a skill folder without SKILL.md", () => {
    const root = rootWith({ "skills/tdd/README.md": "# Wrong file" });

    expect(() => loadSkillSet(root)).toThrow(
      /tdd[\\/]SKILL\.md is invalid: \(document\): A skill folder must hold/,
    );
  });

  it("throws on an invalid document, naming its file", () => {
    const root = rootWith({ "rules/a-rule.md": "---\ndescription: No title\n---\n" });

    expect(() => loadSkillSet(root)).toThrow(/a-rule\.md is invalid: title: /);
  });
});
