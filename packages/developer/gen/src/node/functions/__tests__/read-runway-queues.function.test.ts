/**
 * Stackra file contract:
 * Purpose: unit tests of `readRunwayQueues`: each environment's `queues` block with every queue's visibility timeout
 *          and dead-letter switch, malformed values left out, a queue named with no settings kept empty; undefined
 *          without a runway file or any block; and `discoverMember` puts them on a service's IR (STA-2050).
 * Boundary: test only; writes small member folders under `<gen>/.cache/runway-queues/` (gitignored) and one fixture
 *           service through `writeFixtureMember`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (runway v3); STA-2050.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { discoverMember } from "#node/functions/discover-member.function";
import { readRunwayQueues } from "#node/functions/read-runway-queues.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

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

/** A runway whose environments size `billing` differently, and name `default` with no settings. */
const RUNWAY = [
  "version: 3",
  "environments:",
  "  dev:",
  "    queues:",
  "      billing:",
  "        visibilityTimeoutSeconds: 30 # local runs are short",
  "        dlq: false",
  "  production:",
  "    queues:",
  "      billing:",
  "        visibilityTimeoutSeconds: 300",
  "        dlq: true",
  "      default: {}",
  "  staging:",
  "    port: 4010",
  "",
].join("\n");

describe(readRunwayQueues, () => {
  it("reads each environment's queues with their settings", () => {
    expect(readRunwayQueues(member(RUNWAY))).toEqual({
      dev: { billing: { visibilityTimeoutSeconds: 30, dlq: false } },
      production: { billing: { visibilityTimeoutSeconds: 300, dlq: true }, default: {} },
    });
  });

  it("leaves out a value that is not a whole number of seconds or a boolean", () => {
    const root = member(
      [
        "environments:",
        "  dev:",
        "    queues:",
        "      billing:",
        "        visibilityTimeoutSeconds: soon",
        "        dlq: maybe",
        "      ledger:",
        "        visibilityTimeoutSeconds: -5",
        "      audit:",
        "",
      ].join("\n"),
    );
    expect(readRunwayQueues(root)).toEqual({ dev: { billing: {}, ledger: {}, audit: {} } });
  });

  it("is undefined without a runway file or any queues block", () => {
    expect(readRunwayQueues(member(undefined))).toBeUndefined();
    expect(readRunwayQueues(member("environments:\n  dev:\n    port: 4010\n"))).toBeUndefined();
    expect(readRunwayQueues(member("environments:\n  dev:\n    queues:\n"))).toBeUndefined();
  });

  it("puts a service's queue settings on its IR", async () => {
    const root = writeFixtureMember("billing", {
      "stackra.config.ts": [
        'import { defineService } from "@stackra/config";',
        "export default defineService({});",
        "",
      ].join("\n"),
      "runway.yaml": RUNWAY,
    });
    const ir = await discoverMember(root);
    expect(ir.layout).toBe("service");
    expect(ir.queueSettings?.["production"]?.["billing"]).toEqual({
      visibilityTimeoutSeconds: 300,
      dlq: true,
    });
  });
});
