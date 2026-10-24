/**
 * Stackra file contract:
 * Purpose: unit tests of `renderOpenCode`: skills and rules read on request as skills, sub-agents with derived denies,
 *          commands without the argument hint, and always-on or scoped rules and hooks skipped with a reason.
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

import { renderOpenCode } from "#core/functions/render-opencode.function";

const skill: SkillDocument = {
  kind: "skill",
  name: "naming",
  description: "Name things",
  body: "# Naming\n",
  source: "a",
};
const rule = (overrides: Partial<RuleDocument>): RuleDocument => ({
  kind: "rule",
  name: "tenancy",
  title: "Tenancy",
  description: "Tenant rules",
  always: false,
  globs: [],
  body: "# Tenancy\n",
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
  argumentHint: "<issue-key>",
  body: "Ship $ARGUMENTS\n",
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

describe("renderOpenCode", () => {
  it("writes skills and rules read on request as SKILL.md", () => {
    const { files, skipped } = renderOpenCode([skill, rule({})], "gen");
    expect(skipped).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      "skills/naming/SKILL.md",
      "skills/tenancy/SKILL.md",
    ]);
    expect(frontMatterOf(files[1]?.content ?? "")).toEqual({
      name: "tenancy",
      description: "Tenant rules",
    });
  });

  it("skips always-on and scoped rules, which OpenCode reads from AGENTS.md", () => {
    const { files, skipped } = renderOpenCode(
      [rule({ always: true }), rule({ name: "svc", globs: ["services/**"] })],
      "gen",
    );
    expect(files).toEqual([]);
    expect(skipped.map((entry) => entry.name)).toEqual(["tenancy", "svc"]);
    expect(skipped[0]?.reason).toContain("AGENTS.md");
  });

  it("denies every action a sub-agent's tools do not reach", () => {
    const { files } = renderOpenCode([subagent(["Read", "Grep", "Bash"])], "gen");
    expect(files[0]?.path).toBe("agents/reviewer.md");
    expect(frontMatterOf(files[0]?.content ?? "")).toEqual({
      description: "Reviews diffs",
      mode: "subagent",
      permissions: [
        { action: "edit", resource: "*", effect: "deny" },
        { action: "webfetch", resource: "*", effect: "deny" },
        { action: "websearch", resource: "*", effect: "deny" },
        { action: "subagent", resource: "*", effect: "deny" },
      ],
    });
  });

  it("allows everything when the tools reach every action, and writes no permissions for an empty list", () => {
    const all = renderOpenCode([subagent(["Edit", "Bash", "WebFetch", "WebSearch", "Task"])], "gen")
      .files[0];
    expect(frontMatterOf(all?.content ?? "")).toMatchObject({
      permissions: [{ action: "*", resource: "*", effect: "allow" }],
    });
    const none = renderOpenCode([subagent([])], "gen").files[0];
    expect(frontMatterOf(none?.content ?? "")).toEqual({
      description: "Reviews diffs",
      mode: "subagent",
    });
  });

  it("writes a command with its description only", () => {
    const { files } = renderOpenCode([command], "gen");
    expect(files[0]?.path).toBe("commands/ship.md");
    expect(frontMatterOf(files[0]?.content ?? "")).toEqual({ description: "Ship it" });
  });

  it("skips hooks", () => {
    const { files, skipped } = renderOpenCode([hook], "gen");
    expect(files).toEqual([]);
    expect(skipped).toEqual([
      {
        kind: "hook",
        name: "guard-bash",
        reason: "OpenCode hooks are plugins written in code; it has no hook file",
      },
    ]);
  });
});
