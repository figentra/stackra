/**
 * Stackra file contract:
 * Purpose: unit tests of `runwayQueues`: a job queue an environment of the member's runway leaves out is
 *          `queue_unprovisioned`, once per environment and queue; a provisioned member, `default` alone, a member with
 *          no runway file and a runway with no environment pass (STA-1727).
 * Boundary: test only; writes small member folders under `<gen>/.cache/runway-queues/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296; STA-1723; STA-1727.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { runwayQueues } from "#node/functions/runway-queues.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Counts the folders this process wrote, so tests never share one. */
let written = 0;

/** A member folder holding `runway` as its runway.yaml (none when undefined); returns its root. */
function member(runway: string | undefined): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "runway-queues", `${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  if (runway !== undefined) writeFileSync(join(root, "runway.yaml"), runway);
  return root;
}

/** A manifest whose job actions run on `queues` (undefined is the default queue). */
function jobs(...queues: (string | undefined)[]): StackraManifest {
  return {
    actions: queues.map((queue, index) => ({
      key: `billing.job${index}.run@1`,
      kind: "action",
      job: queue === undefined ? {} : { queue },
    })),
  } as unknown as StackraManifest;
}

const RUNWAY = [
  "version: 3",
  "environments:",
  "  staging:",
  "    queues:",
  "      billing:",
  "        visibilityTimeoutSeconds: 300",
  "  production:",
  "    queues:",
  "      billing:",
  "        dlq: true",
  "      ledger_close:",
  "        dlq: true",
].join("\n");

describe(runwayQueues, () => {
  it("refuses each job queue an environment leaves out", () => {
    const errors = runwayQueues(member(RUNWAY), jobs("billing", "ledger_close", undefined));
    expect(errors.map((error) => `${error.code} ${error.file} ${error.subject}`)).toEqual([
      "queue_unprovisioned runway.yaml staging.ledger_close",
    ]);
    expect(errors[0]?.fix).toContain("environments.staging.queues");
  });

  it("passes a provisioned member and the default queue", () => {
    expect(runwayQueues(member(RUNWAY), jobs("billing", undefined))).toEqual([]);
    expect(runwayQueues(member("environments:\n  staging:\n"), jobs(undefined))).toEqual([]);
  });

  it("passes a member with no runway file or no environment", () => {
    expect(runwayQueues(member(undefined), jobs("billing"))).toEqual([]);
    expect(runwayQueues(member("version: 3\nenvironments: {}\n"), jobs("billing"))).toEqual([]);
  });
});
