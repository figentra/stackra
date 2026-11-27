/**
 * Stackra file contract:
 * Purpose: unit tests of `guidelinesOf`: the always-on rules appear in full with their headings one level down (a
 *          fenced `#` line untouched), the on-request rules and the skills are listed by URI and description, and the
 *          text ends with `stackra gen --check` and the tests. The shipped `@stackra/skills` set renders.
 * Boundary: test only; in-memory documents, and the documents `@stackra/skills` ships.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 5 and 6); STA-2919.
 */
import { describe, expect, it } from "@stackra/testing";
import type { AgentDocument } from "@stackra/skills";
import { loadSkillSet } from "@stackra/skills/node";

import { finishSteps } from "#node/functions/finish-steps.function";
import { guidelinesOf } from "#node/functions/guidelines-of.function";

/** A fence line in Markdown. */
const FENCE = /^\s*(```|~~~)/;

/** `body` as the Always section must hold it: every heading of level 1 to 5 outside a code fence one level down. */
const nested = (body: string): string => {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) fenced = !fenced;
      return !fenced && /^#{1,5} /.test(line) ? `#${line}` : line;
    })
    .join("\n");
};

const DOCUMENTS: readonly AgentDocument[] = [
  {
    kind: "rule",
    name: "naming",
    title: "Naming",
    description: "How to name things.",
    always: true,
    globs: [],
    body: "# Naming\n\nUse whole words.\n\n```md\n# not a heading\n```\n",
    source: "rules/naming.md",
  },
  {
    kind: "rule",
    name: "tenancy",
    title: "Tenancy",
    description: "Tenant isolation, on request.",
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
];

describe("guidelinesOf", () => {
  it("holds the always-on rules in full and lists the rest by URI", () => {
    const text = guidelinesOf({ root: "/nowhere", documents: DOCUMENTS, tools: new Set() });

    expect(text.startsWith("# Stackra guidelines\n")).toBe(true);
    expect(text).toContain("## Naming\n\nUse whole words.");
    expect(text).toContain("```md\n# not a heading\n```");
    expect(text).not.toContain("Every query runs in withTenant");
    expect(text).toContain(
      "- `stackra://rules/tenancy` (rule): Tenant isolation, on request.\n" +
        "- `stackra://skills/backend-errors` (skill): Raise errors the Stackra way.",
    );
    expect(text).toContain("`stackra://manifest`");
    expect(text).toContain("## Every change ends the same way");
    expect(text).toContain("`stackra gen --check` (the `gen` tool with `check: true`)");
  });

  it("says so when no rule is always on and nothing is on request", () => {
    const text = guidelinesOf({ root: "/nowhere", documents: [], tools: new Set() });

    expect(text).toContain("No rule is always on.");
    expect(text).toContain("Nothing else is served.");
  });

  it("renders the conventions @stackra/skills ships", () => {
    const documents = loadSkillSet();
    const text = guidelinesOf({ root: "/nowhere", documents, tools: new Set(["verify"]) });

    for (const document of documents) {
      if (document.kind === "skill") expect(text).toContain(`stackra://skills/${document.name}`);
      if (document.kind === "rule" && !document.always)
        expect(text).toContain(`stackra://rules/${document.name}`);
    }
    expect(text).toMatch(/^## Naming and casing$/m);
  });
  // P-006: for every skill set and tool set, the guidelines hold each always-on rule one level down, every other rule
  // and skill by URI and description, and end with the finish steps of that tool set.
  it("holds every always-on rule nested, lists the rest and ends with the finish steps, for every set", () => {
    const shipped = loadSkillSet();
    const sets: readonly (readonly AgentDocument[])[] = [
      [],
      DOCUMENTS,
      shipped,
      shipped.filter((document) => document.kind === "rule"),
      shipped.filter((document) => document.kind === "skill"),
    ];
    const toolSets: readonly ReadonlySet<string>[] = [
      new Set(),
      new Set(["gen", "verify"]),
      new Set(["gen", "test", "verify"]),
    ];

    for (const documents of sets) {
      for (const tools of toolSets) {
        const text = guidelinesOf({ root: "/nowhere", documents, tools });
        const always = text.slice(text.indexOf("\n## Always\n"), text.indexOf("\n## On request\n"));
        let fenced = false;
        for (const line of always.split("\n").slice(2)) {
          if (FENCE.test(line)) fenced = !fenced;
          // Nested under "## Always": no rule heading stays at the top level.
          if (!fenced) expect(line).not.toMatch(/^# /);
        }
        for (const document of documents) {
          if (document.kind === "rule" && document.always) {
            expect(always, document.name).toContain(nested(document.body.trim()));
          } else if (document.kind === "rule") {
            expect(text).toContain(
              `- \`stackra://rules/${document.name}\` (rule): ${document.description}\n`,
            );
          } else if (document.kind === "skill") {
            expect(text).toContain(
              `- \`stackra://skills/${document.name}\` (skill): ${document.description}\n`,
            );
          }
        }
        expect(text.endsWith(`${finishSteps(tools)}\n`)).toBe(true);
      }
    }
  });
});
