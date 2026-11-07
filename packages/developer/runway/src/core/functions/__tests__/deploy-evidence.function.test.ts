/**
 * Stackra file contract:
 * Purpose: unit tests of `deployEvidence`: `rollout` is true only for a gradual strategy kind with automatic rollback,
 *          false for all-at-once (whatever its rollback), and null when the runway declares no strategy; `destructive`
 *          stays null (floor) until gen classifies migrations; the commit, target and member pass through.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); STA-2104.
 */
import { describe, expect, it } from "@stackra/testing";

import { deployEvidence } from "#core/functions/deploy-evidence.function";
import { parseRunway } from "#core/functions/parse-runway.function";

const SHA = "c".repeat(40);

/** A root runway whose `release.strategy` is `strategy`, or none. */
const root = (strategy?: Record<string, unknown>) =>
  parseRunway("root", {
    version: 3,
    project: "figentra-pay",
    environments: { production: { region: "me" } },
    ...(strategy === undefined ? {} : { release: { strategy } }),
  });

/** The evidence of a docs deploy to production under `strategy`. */
const evidence = (strategy?: Record<string, unknown>) =>
  deployEvidence(root(strategy), {
    repo: "figentra/pay",
    environment: "production",
    sha: SHA,
    target: "cloudflare-workers",
    member: "docs",
  });

describe("deployEvidence", () => {
  /** Only a step-by-step release that rolls itself back counts as a gradual rollout. */
  it("says rollout only for a gradual kind with automatic rollback", () => {
    expect(evidence({ kind: "canary", autoRollback: true }).rollout).toBe(true);
    expect(evidence({ kind: "canary", autoRollback: false }).rollout).toBe(false);
    expect(evidence({ kind: "all-at-once", healthGate: true, autoRollback: true }).rollout).toBe(
      false,
    );
    expect(evidence().rollout).toBeNull();
  });

  /** Unknown is the owner's: destructive is null until gen classifies, and the rest passes through. */
  it("leaves destructive null and passes the job's facts through", () => {
    expect(evidence({ kind: "all-at-once", healthGate: true, autoRollback: true })).toEqual({
      schema: "runway.evidence/v1",
      repo: "figentra/pay",
      environment: "production",
      sha: SHA,
      target: "cloudflare-workers",
      member: "docs",
      rollout: false,
      rolloutDetail: { kind: "all-at-once", healthGate: true, autoRollback: true },
      destructive: null,
      destructiveMigrations: [],
    });
  });
});
