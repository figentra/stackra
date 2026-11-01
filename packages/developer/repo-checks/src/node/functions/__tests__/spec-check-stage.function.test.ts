/**
 * Stackra file contract:
 * Purpose: unit tests of `specCheckStage` (with `specCheckClarified`, `specCheckPlan` and `specCheckTasks` under it): the
 *          stage rules of a spec at each status, on a fixture folder whose prefix is `os`, not the one core uses.
 * Boundary: test only; reads the fixture folder beside this file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0120 (spec stages); ADR 0022 (test placement).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { specCheckClarified } from "#node/functions/spec-check-clarified.function";
import { specCheckStage } from "#node/functions/spec-check-stage.function";
import { specCheckTasks } from "#node/functions/spec-check-tasks.function";

const FOLDER = "os-901-widget";
const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`fixtures/sdd/${FOLDER}/${name}`, import.meta.url)), "utf8");
const known = new Set(["tests", "spec-task"]);
const prefixes = ["os"];
const FILES = ["spec.md", "plan.md", "tasks.md"];

/** The fixture at `status`, keeping only the history lines that lead there. */
const at = (status: string): string =>
  fixture("spec.md")
    .replace("**Status**: Done", `**Status**: ${status}`)
    .replaceAll(/- 2026-10-20 · .*→ (?!Draft|Clarified).*\n/g, (l) =>
      l.includes(`→ ${status}`) ? l : "",
    );

const stageOf = (
  text: string,
  over: Partial<Parameters<typeof specCheckStage>[2]> = {},
): string[] =>
  specCheckStage(FOLDER, text, {
    files: FILES,
    plan: fixture("plan.md"),
    tasks: fixture("tasks.md"),
    known,
    prefixes,
    ...over,
  });

const IMPACT = [
  "Apps touched",
  "Services touched",
  "Packages touched",
  "Cross-service events",
  "Tenancy and data",
  "Secrets",
  "ADR needed",
  "New dependencies",
  "Deploy modes",
  "Licence tier",
  "Docs to update",
  "Lane",
  "Change risk",
];
const small = ({
  clarified = "complete",
  linear = "OS-12",
  stage = "Draft",
  value = "none",
} = {}) =>
  `# Spec\n\n**Status**: ${stage}\n\n**Linear**: ${linear}\n\n**Clarifications status**: ${clarified}\n\n## Impact\n\n${IMPACT.map((f) => `- **${f}**: ${value}`).join("\n")}\n\n## Status history\n\n- d · Draft → ${stage}\n`;

describe("specCheckStage", () => {
  it("passes a Draft with open questions and names the folder shape of the repository", () => {
    const draft = small({ clarified: "pending", linear: "OS-n", value: "[open]" });
    expect(specCheckStage("os-12-x", draft, { prefixes })).toEqual([]);
    expect(specCheckStage("001-x", draft, { prefixes })[0]).toMatch(/`os-<n>-<slug>`/);
    expect(specCheckStage("sta-12-x", draft, { prefixes })[0]).toMatch(/`os-<n>-<slug>`/);
    expect(specCheckStage("os-12-x", draft, { prefixes: ["os", "ops"] })).toEqual([]);
    expect(specCheckStage("001-x", draft, { prefixes: ["os", "ops"] })[0]).toMatch(
      /`<prefix>-<n>-<slug>`/,
    );
  });

  it("reads the Linear key by the folder's own prefix", () => {
    expect(specCheckStage("os-12-x", small({ linear: "OS-13" }), { prefixes }).join()).toMatch(
      /`\*\*Linear\*\*: OS-13` does not match the folder key OS-12/,
    );
    expect(
      specCheckStage("os-12-x", small({ stage: "Clarified", linear: "STA-12" })).join(),
    ).toMatch(/has no OS-n key/);
  });

  it("needs a declared status, the Clarified rules and a history line", () => {
    expect(specCheckStage("os-12-x", small({ stage: "Bogus" }))[0]).toMatch(/Status/);
    expect(
      specCheckStage("os-12-x", small({ clarified: "pending", stage: "Clarified" })).join(),
    ).toMatch(/Clarifications/);
    expect(specCheckStage("os-12-x", small({ stage: "Clarified" }))).toEqual([]);
    expect(
      specCheckStage(
        "os-12-x",
        small({ stage: "Clarified" }).replace("Draft → Clarified", "x"),
      ).join(),
    ).toMatch(/Status history.*Clarified/);
    expect(specCheckStage("os-12-x", small({ stage: "Planned" })).join()).toMatch(/needs plan\.md/);
    expect(specCheckStage("os-12-x", small({ stage: "Abandoned", clarified: "pending" }))).toEqual(
      [],
    );
  });

  it("passes the fixture at every stage from Clarified to Done", () => {
    for (const s of ["Clarified", "Planned", "Tasked", "Implementing", "Done"])
      expect(stageOf(at(s)), s).toEqual([]);
  });

  it("Planned: constitution rows, deploy modes and FR validation", () => {
    const planned = at("Planned");
    const plan = fixture("plan.md");
    expect(stageOf(planned, { plan: plan.replace("| PASS   |", "| TODO   |") }).join()).toMatch(
      /Constitution Check `Boundaries` is `TODO`/,
    );
    expect(stageOf(planned, { plan: plan.replace("no tenant data", "") }).join()).toMatch(
      /`Tenancy` is N\/A without a reason/,
    );
    expect(stageOf(planned, { plan: plan.replace(/^\| Air-gapped.*\n/m, "") }).join()).toMatch(
      /`air-gapped` row/,
    );
    expect(stageOf(planned, { plan: plan.replace("FR-001, FR-002", "FR-001") }).join()).toMatch(
      /FR-002 is validated by no P-###/,
    );
    const exampleOnly = planned.replace("SHALL refuse it.", "SHALL refuse it. (example-only)");
    expect(stageOf(exampleOnly, { plan: plan.replace("FR-001, FR-002", "FR-001") })).toEqual([]);
  });

  it("Implementing needs a ticked task; Done needs them all", () => {
    const none = fixture("tasks.md").replaceAll("- [x]", "- [ ]");
    expect(stageOf(at("Implementing"), { tasks: none }).join()).toMatch(/no task is ticked/);
    const one = fixture("tasks.md").replace("- [x] T002", "- [ ] T002");
    expect(stageOf(at("Implementing"), { tasks: one })).toEqual([]);
    expect(stageOf(at("Done"), { tasks: one }).join()).toMatch(/T002 are unticked/);
  });
});

describe("specCheckClarified", () => {
  it("passes a clarified, linked, answered spec and names each blocker", () => {
    expect(specCheckClarified(small(), "os")).toEqual([]);
    expect(specCheckClarified(small({ clarified: "pending" }), "os")[0]).toMatch(/Clarifications/);
    expect(specCheckClarified(small({ linear: "OS-n" }), "os")[0]).toBe(
      "`**Linear**` has no OS-n key",
    );
    expect(specCheckClarified(`${small()}[NEEDS CLARIFICATION: x]`, "os").join()).toMatch(
      /NEEDS CLARIFICATION/,
    );
    expect(specCheckClarified(small({ value: "[apps]" }), "os").join()).toMatch(/unanswered/);
    expect(
      specCheckClarified("**Linear**: OS-1\n**Clarifications status**: complete\n", "os").join(),
    ).toMatch(/Impact/);
    expect(
      specCheckClarified(`${small({ clarified: "pending" })}<!-- complete -->`, "os").join(),
    ).toMatch(/Clarif/);
  });
});

const lint = (t: string): string[] =>
  specCheckTasks(t, { spec: fixture("spec.md"), plan: fixture("plan.md"), known, prefixes });

describe("specCheckTasks", () => {
  it("names the line and the problem", () => {
    const tasks = fixture("tasks.md");
    expect(lint(tasks)).toEqual([]);
    expect(lint(tasks.replace("T002 [P]", "T001 [P]")).join()).toMatch(/T001 repeats line/);
    expect(lint(tasks.replace("covers: FR-002 ", "")).join()).toMatch(/T002 has no `covers:`/);
    expect(lint(tasks.replace("covers: FR-002", "covers: FR-009")).join()).toMatch(
      /covers FR-009, which/,
    );
    expect(lint(tasks.replace("route: tests", "route: nope")).join()).toMatch(
      /route `nope` is not a task type/,
    );
    expect(lint(tasks.replace("deps: T001", "deps: T042")).join()).toMatch(
      /depends on T042, which does not exist/,
    );
    expect(lint(tasks.replace("route: tests", "route: tests — deps: T002")).join()).toMatch(
      /dependency cycle/,
    );
    expect(lint(tasks.replace("covers: FR-002", "covers: SC-001")).join()).toMatch(
      /FR-002 is covered by no task/,
    );
    expect(lint(tasks.replace("src/build.ts", "src/__tests__/build.test.ts")).join()).toMatch(
      /\[P\] tasks T001 and T002 share/,
    );
    expect(lint("")).toEqual(["tasks.md: no `- [ ] T###` task lines"]);
  });

  it("reads a trailing issue tag only for the repository's prefixes", () => {
    const tasks = fixture("tasks.md");
    const dangling = tasks.replace("deps: T001 [OS-903]", "deps: T042 [OS-903]");
    expect(lint(dangling).join()).toMatch(/depends on T042/);
    // [ZZ-903] is no key of this repository, so it does not end the deps field and the deps read as none.
    expect(lint(dangling.replace("[OS-903]", "[ZZ-903]"))).toEqual([]);
  });
});
