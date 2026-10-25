/**
 * Stackra file contract:
 * Purpose: unit tests of `renderKiro`: skills, steering files with the three inclusion modes, sub-agents with mapped and
 *          de-duplicated tools, an unmapped tool refused, and commands and hooks skipped.
 * Boundary: test only; documents are built inline in the shapes `@stackra/skills` parses.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2); ADR 0286 (decision 16).
 */
import type {
  CommandDocument,
  HookDocument,
  RuleDocument,
  SkillDocument,
  SubagentDocument,
} from "@stackra/skills";
import { describe, expect, it } from "@stackra/testing";
import { parse } from "yaml";

import { RenderInputError } from "#core/errors/render-input.error";
import { renderKiro } from "#core/functions/render-kiro.function";

const skill: SkillDocument = {
  kind: "skill",
  name: "naming",
  description: "Name things",
  body: "# Naming\n",
  source: "a",
};
const rule = (overrides: Partial<RuleDocument>): RuleDocument => ({
  kind: "rule",
  name: "versions",
  title: "Versions",
  description: "Pin versions",
  always: false,
  globs: [],
  body: "# Versions\n",
  source: "b",
  ...overrides,
});
const subagent = (tools: readonly string[]): SubagentDocument => ({
  kind: "subagent",
  name: "reviewer",
  description: "Reviews diffs",
  tools,
  body: "Review.\n",
  source: "c",
});
const command: CommandDocument = {
  kind: "command",
  name: "ship",
  description: "Ship it",
  body: "Ship\n",
  source: "d",
};
const hook: HookDocument = {
  kind: "hook",
  name: "guard-bash",
  description: "Guard",
  event: "pre_tool_use",
  run: "node guard.mjs",
  body: "",
  source: "e",
};

/** The parsed frontmatter of a rendered file. */
const frontMatterOf = (content: string): unknown => parse(content.split("---\n")[1] ?? "");

describe("renderKiro", () => {
  it("writes a skill as SKILL.md", () => {
    const { files } = renderKiro([skill], "gen");
    expect(files[0]?.path).toBe("skills/naming/SKILL.md");
    expect(frontMatterOf(files[0]?.content ?? "")).toEqual({
      name: "naming",
      description: "Name things",
    });
  });

  it("writes rules as steering files: always, fileMatch and manual", () => {
    const { files } = renderKiro(
      [
        rule({ always: true }),
        rule({ name: "one", globs: ["services/**"] }),
        rule({ name: "two", globs: ["apps/**", "packages/**"] }),
        rule({ name: "tenancy" }),
      ],
      "gen",
    );
    expect(files.map((file) => file.path)).toEqual([
      "steering/versions.md",
      "steering/one.md",
      "steering/two.md",
      "steering/tenancy.md",
    ]);
    expect(files.map((file) => frontMatterOf(file.content))).toEqual([
      { inclusion: "always" },
      { inclusion: "fileMatch", fileMatchPattern: "services/**" },
      { inclusion: "fileMatch", fileMatchPattern: ["apps/**", "packages/**"] },
      { inclusion: "manual" },
    ]);
  });

  it("maps a sub-agent's tools, de-duplicated, and drops Skill", () => {
    const { files } = renderKiro([subagent(["Read", "Grep", "Bash", "Skill"])], "gen");
    expect(files[0]?.path).toBe("agents/reviewer.md");
    expect(frontMatterOf(files[0]?.content ?? "")).toEqual({
      name: "reviewer",
      description: "Reviews diffs",
      tools: ["read", "shell"],
    });
  });

  it("writes no tools for an empty list", () => {
    const { files } = renderKiro([subagent([])], "gen");
    expect(frontMatterOf(files[0]?.content ?? "")).toEqual({
      name: "reviewer",
      description: "Reviews diffs",
    });
  });

  it("refuses a tool KIRO_TOOLS does not map", () => {
    expect(() => renderKiro([subagent(["Read", "Teleport"])], "gen")).toThrow(RenderInputError);
    expect(() => renderKiro([subagent(["Teleport"])], "gen")).toThrow(/Teleport/);
  });

  it("skips commands and hooks", () => {
    const { files, skipped } = renderKiro([command, hook], "gen");
    expect(files).toEqual([]);
    expect(skipped.map((entry) => [entry.kind, entry.name])).toEqual([
      ["command", "ship"],
      ["hook", "guard-bash"],
    ]);
  });
});
