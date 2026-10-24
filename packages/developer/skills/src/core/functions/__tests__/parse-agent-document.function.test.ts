/**
 * Stackra file contract:
 * Purpose: unit tests of `parseAgentDocument`: each of the five kinds parsed with its defaults, the derived name, a
 *          frozen result, and the refusals for a bad path, missing and unknown keys, a wrong hook event and a
 *          frontmatter name that differs from the path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2); ADR 0294 (decision 20).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
import { parseAgentDocument } from "#core/functions/parse-agent-document.function";
import type { HookDocument } from "#core/types/hook-document.type";
import type { RuleDocument } from "#core/types/rule-document.type";

/** A document with `frontMatter` lines and a short body. */
const doc = (...frontMatter: string[]): string => `---\n${frontMatter.join("\n")}\n---\n\n# Body\n`;

describe("parseAgentDocument", () => {
  it("parses a skill, named by its folder", () => {
    const skill = parseAgentDocument(
      "skill",
      doc("name: backend-errors", "description: Raise errors the Stackra way"),
      "assets/skills/backend-errors/SKILL.md",
    );

    expect(skill).toEqual({
      kind: "skill",
      name: "backend-errors",
      description: "Raise errors the Stackra way",
      body: "# Body\n",
      source: "assets/skills/backend-errors/SKILL.md",
    });
    expect(Object.isFrozen(skill)).toBe(true);
  });

  it("parses a rule and applies its defaults", () => {
    const rule = parseAgentDocument(
      "rule",
      doc("title: Tenancy", "description: Two layers"),
      "rules/tenancy.md",
    );

    expectTypeOf(rule).toEqualTypeOf<RuleDocument>();
    expect(rule).toMatchObject({
      kind: "rule",
      name: "tenancy",
      title: "Tenancy",
      always: false,
      globs: [],
    });
  });

  it("keeps a rule's globs and always flag", () => {
    const rule = parseAgentDocument(
      "rule",
      doc("title: Services", "description: Checklist", "always: true", 'globs: ["services/**"]'),
      "rules/service-checklist.md",
    );

    expect(rule).toMatchObject({ always: true, globs: ["services/**"] });
  });

  it("parses a sub-agent with its tools", () => {
    expect(
      parseAgentDocument(
        "subagent",
        doc("description: Writes tests", "tools: [Read, Write]"),
        "test-writer.md",
      ),
    ).toMatchObject({ kind: "subagent", name: "test-writer", tools: ["Read", "Write"] });
    expect(parseAgentDocument("subagent", doc("description: Reads"), "reader.md")).toMatchObject({
      tools: [],
    });
  });

  it("parses a command with an argument hint", () => {
    expect(
      parseAgentDocument(
        "command",
        doc("description: Start a spec", "argumentHint: <issue-key>"),
        "spec.md",
      ),
    ).toMatchObject({ kind: "command", name: "spec", argumentHint: "<issue-key>" });
  });

  it("parses a hook", () => {
    const hook = parseAgentDocument(
      "hook",
      doc(
        "description: Refuse secret reads",
        "event: pre_tool_use",
        "matcher: Bash",
        "run: stackra agents guard bash",
      ),
      "hooks/guard-bash.md",
    );

    expectTypeOf(hook).toEqualTypeOf<HookDocument>();
    expect(hook).toMatchObject({
      event: "pre_tool_use",
      matcher: "Bash",
      run: "stackra agents guard bash",
    });
  });

  it("refuses a path that gives no name", () => {
    expect(() =>
      parseAgentDocument("rule", doc("title: A", "description: B"), "rules/Naming.md"),
    ).toThrow(
      new AgentDocumentInvalidError("rules/Naming.md", [
        { path: "name", message: '"Naming" is not a kebab-case name' },
      ]),
    );
  });

  it("names every missing, empty and unknown key", () => {
    let caught: unknown;
    try {
      parseAgentDocument("rule", doc('title: " "', "alwaysOn: true"), "rules/a.md");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AgentDocumentInvalidError);
    const paths = (caught as AgentDocumentInvalidError).issues.map((issue) => issue.path);
    expect(paths).toEqual(expect.arrayContaining(["title", "description", ""]));
  });

  it("refuses a hook event no assistant has", () => {
    expect(() =>
      parseAgentDocument("hook", doc("description: A", "event: on_save", "run: x"), "hooks/a.md"),
    ).toThrow(/hooks\/a\.md is invalid: event: /);
  });

  it("refuses a frontmatter name that differs from the path", () => {
    expect(() =>
      parseAgentDocument(
        "skill",
        doc("name: errors", "description: A"),
        "skills/backend-errors/SKILL.md",
      ),
    ).toThrow(
      new AgentDocumentInvalidError("skills/backend-errors/SKILL.md", [
        {
          path: "name",
          message: '"errors" differs from the name its path gives, "backend-errors"',
        },
      ]),
    );
  });
});
