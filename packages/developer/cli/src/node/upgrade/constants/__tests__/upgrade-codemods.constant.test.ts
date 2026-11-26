/**
 * Stackra file contract:
 * Purpose: the codemod fixture test of `stackra upgrade` (ADR 0199 Enforcement): every codemod in `UPGRADE_CODEMODS`
 *          that edits or reports source has a fixture; each fixture file becomes its expected source with exactly its
 *          expected findings, a second run changes nothing, and a file the codemod must not touch is left byte for
 *          byte. The registry itself is checked: unique kebab-case ids, exact versions, oldest release first, a note
 *          and a source each, and the step codemods run `stackra encore:prepare` once per service. The release gate is
 *          held on this repository: every break mark in a pending `@stackra/*` changeset or an `@stackra/*` changelog
 *          entry from 0.4.0 on has an entry (`stackra upgrade-notes`), and the upgrades the review named
 *          (0.20.0 to 0.29.0, 0.5.0 to 0.8.0) print the notes of the releases in between.
 * Boundary: test only; runs the real ast-grep and ts-morph engines over strings, writes no file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2 and Enforcement); STA-145.
 */
import { fileURLToPath } from "node:url";

import type { Project } from "ts-morph";

import { beforeAll, describe, expect, it } from "@stackra/testing";

import { ACTIONS_APPROVAL_GATE_PORT_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/actions-approval-gate-port.fixture";
import { ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/actions-idempotency-complete-refused.fixture";
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";
import { CONFIG_INFISICAL_STORE_REMOVED_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/config-infisical-store-removed.fixture";
import { IDENTITY_ACCOUNT_SESSION_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/identity-account-session.fixture";
import { OUTBOX_ISOLATION_HELPERS_MOVE_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/outbox-isolation-helpers-move.fixture";
import { OUTBOX_ROW_OWNERS_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/outbox-row-owners.fixture";
import { QUEUE_SCHEDULER_ROW_OWNERS_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/queue-scheduler-row-owners.fixture";
import { RUNWAY_RUN_PROGRAM_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/runway-run-program.fixture";
import { UI_RICH_TEXT_ENTRY_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/ui-rich-text-entry.fixture";
import { WORKFLOW_JOURNAL_ROW_OWNERS_FIXTURE } from "#node/upgrade/constants/__tests__/fixtures/workflow-journal-row-owners.fixture";
import { UPGRADE_CODEMODS } from "#node/upgrade/constants/upgrade-codemods.constant";
import { UPGRADE_VERSION_PATTERN } from "#node/upgrade/constants/upgrade-version-pattern.constant";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { checkUpgradeNotes } from "#node/upgrade/functions/check-upgrade-notes.function";
import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";
import { createCodemodProject } from "#node/upgrade/functions/create-codemod-project.function";
import { loadCodemodEngines } from "#node/upgrade/functions/load-codemod-engines.function";
import { planUpgradeCodemods } from "#node/upgrade/functions/plan-upgrade-codemods.function";
import { readReleaseNotes } from "#node/upgrade/functions/read-release-notes.function";
import { runSourceCodemods } from "#node/upgrade/functions/run-source-codemods.function";
import { upgradeStepRuns } from "#node/upgrade/functions/upgrade-step-runs.function";
import type { CodemodEngines } from "#node/upgrade/types/codemod-engines.type";

const FIXTURES: Readonly<Record<string, CodemodFixture>> = {
  "ui-rich-text-entry": UI_RICH_TEXT_ENTRY_FIXTURE,
  "actions-approval-gate-port": ACTIONS_APPROVAL_GATE_PORT_FIXTURE,
  "identity-account-session": IDENTITY_ACCOUNT_SESSION_FIXTURE,
  "config-infisical-store-removed": CONFIG_INFISICAL_STORE_REMOVED_FIXTURE,
  "actions-idempotency-complete-refused": ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_FIXTURE,
  "runway-run-program": RUNWAY_RUN_PROGRAM_FIXTURE,
  "outbox-row-owners": OUTBOX_ROW_OWNERS_FIXTURE,
  "workflow-journal-row-owners": WORKFLOW_JOURNAL_ROW_OWNERS_FIXTURE,
  "queue-scheduler-row-owners": QUEUE_SCHEDULER_ROW_OWNERS_FIXTURE,
  "outbox-isolation-helpers-move": OUTBOX_ISOLATION_HELPERS_MOVE_FIXTURE,
};

/** This repository's root, where the release notes are. */
const REPOSITORY = workspaceRoot(fileURLToPath(new URL(".", import.meta.url)));

let engines: CodemodEngines;
let project: Project;

beforeAll(async () => {
  engines = await loadCodemodEngines();
  project = createCodemodProject(engines);
});

const codemodOf = (id: string) => {
  const codemod = UPGRADE_CODEMODS.find((entry) => entry.id === id);
  if (codemod === undefined) throw new Error(`no codemod ${id}`);
  return codemod;
};

describe("UPGRADE_CODEMODS", () => {
  it("has unique kebab-case ids, exact versions oldest first, and a title, note and source each", () => {
    const ids = UPGRADE_CODEMODS.map((codemod) => codemod.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const codemod of UPGRADE_CODEMODS) {
      expect(codemod.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(codemod.version).toMatch(UPGRADE_VERSION_PATTERN);
      expect(codemod.title.length).toBeGreaterThan(0);
      expect(codemod.note.length).toBeGreaterThan(40);
      expect(codemod.source.length).toBeGreaterThan(0);
    }
    const versions = UPGRADE_CODEMODS.map((codemod) => codemod.version);
    expect(versions).toEqual(versions.toSorted(compareUpgradeVersions));
  });

  it("has a fixture for every codemod that edits or reports source, and none for an unknown id", () => {
    const sourceIds = UPGRADE_CODEMODS.filter(
      (codemod) => codemod.renames !== undefined || codemod.report !== undefined,
    ).map((codemod) => codemod.id);
    expect(Object.keys(FIXTURES).toSorted()).toEqual(sourceIds.toSorted());
  });

  it.each(Object.entries(FIXTURES))(
    "%s: turns each fixture file into its expected source and reports exactly its findings",
    (id, fixture) => {
      for (const file of fixture.files) {
        const result = runSourceCodemods(engines, project, file.path, file.before, [codemodOf(id)]);
        expect(result.text, file.path).toBe(file.after);
        expect(
          result.findings.map((finding) => `${finding.line}:${finding.column}`),
          file.path,
        ).toEqual(file.findings ?? []);
        expect(result.changedBy, file.path).toEqual(file.after === file.before ? [] : [id]);
        for (const finding of result.findings) {
          expect(finding.file).toBe(file.path);
          expect(finding.codemod).toBe(id);
          expect(finding.code.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(Object.entries(FIXTURES))("%s: changes nothing on a second run", (id, fixture) => {
    for (const file of fixture.files) {
      const again = runSourceCodemods(engines, project, file.path, file.after, [codemodOf(id)]);
      expect(again.text, file.path).toBe(file.after);
      expect(again.changedBy, file.path).toEqual([]);
    }
  });

  it("runs stackra encore:prepare once in every service for the two Encore codemods", () => {
    const runs = upgradeStepRuns(
      [codemodOf("services-encore-app-root"), codemodOf("services-tsconfig-no-base-url")],
      ["services/orders", "services/billing"],
    );
    expect(
      runs.map((run) => `${run.cwd}: ${run.command.join(" ")} (${run.why.join(", ")})`),
    ).toEqual([
      ".: pnpm install (install)",
      "services/orders: pnpm exec stackra encore:prepare (services-encore-app-root, services-tsconfig-no-base-url)",
      "services/billing: pnpm exec stackra encore:prepare (services-encore-app-root, services-tsconfig-no-base-url)",
      ".: pnpm exec stackra gen (gen)",
    ]);
  });
  it("covers every break mark in this repository's @stackra/* changesets and changelogs (stackra upgrade-notes)", () => {
    const notes = readReleaseNotes(REPOSITORY);
    // The floor's own release is read, so the check cannot pass by reading nothing.
    expect(notes.some((note) => note.version === "0.4.0")).toBe(true);
    expect(checkUpgradeNotes(notes, UPGRADE_CODEMODS)).toEqual([]);
  });

  it.each([
    {
      from: "0.20.0",
      to: "0.29.0",
      ids: [
        "tenancy-factory-owner-id",
        "integrations-peer",
        "tenancy-memory-tier-isolation",
        "peers-no-fork",
        "gen-tool-reason",
        "gen-guarded-http",
        "packages-tenancy-contract-step",
        "webhooks-row-owners",
        "outbox-row-owners",
        "workflow-journal-row-owners",
        "settings-typed-fields",
      ],
    },
    { from: "0.5.0", to: "0.8.0", ids: ["runway-unread-fields-dropped"] },
  ])("plans the entry of every release with a break from $from to $to", ({ from, to, ids }) => {
    expect(planUpgradeCodemods(UPGRADE_CODEMODS, from, to).map((codemod) => codemod.id)).toEqual(
      ids,
    );
  });
});
