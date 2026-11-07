/**
 * Stackra file contract:
 * Purpose: unit tests of `deployEvidence`: `rollout` is judged per target. A production Workers member with traffic
 *          steps and no Durable Object migration is true; a migrating member, a single-step member and a staging
 *          deploy are false; another declared target is false (no rollout primitive); an undeclared target, a missing
 *          member or an unread wrangler config is null. `destructive` stays null (floor); the commit, target and member
 *          pass through.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); ADR 0519 (decision 2); STA-2104.
 */
import { describe, expect, it } from "@stackra/testing";

import { deployEvidence } from "#core/functions/deploy-evidence.function";
import { parseRunway } from "#core/functions/parse-runway.function";

const SHA = "c".repeat(40);

/** A root runway with a gradual `edge` member, an all-at-once `docs` site and an Encore app. */
const ROOT = parseRunway("root", {
  version: 3,
  project: "figentra-pay",
  environments: { production: { region: "me" }, staging: { region: "me" } },
  release: { strategy: { kind: "all-at-once", autoRollback: true } },
  targets: {
    "cloudflare-workers": {
      members: {
        edge: { path: "workers/edge", preset: "edge" },
        docs: { path: "apps/docs", preset: "public-site" },
      },
    },
    "encore-cloud": { cloud: "aws" },
  },
});

/** The evidence of one job. */
const evidence = (
  target: string,
  extra: { member?: string; migrates?: boolean; environment?: string } = {},
) =>
  deployEvidence(ROOT, {
    repo: "figentra/pay",
    environment: extra.environment ?? "production",
    sha: SHA,
    target,
    member: extra.member,
    migrates: extra.migrates,
  });

describe("deployEvidence", () => {
  /** A stepped Workers member that ships no migration rolls out, whatever the root strategy says. */
  it("says rollout for a production Workers member with steps and no migration", () => {
    expect(evidence("cloudflare-workers", { member: "edge", migrates: false })).toMatchObject({
      rollout: true,
      rolloutDetail: {
        kind: "staged",
        healthGate: true,
        autoRollback: true,
        steps: [10, 50, 100],
        floorReason: null,
      },
    });
  });

  /** A migrating member goes out with `wrangler deploy` at 100%; a single step is all at once. */
  it("is false for a migrating member, a single-step member and off production", () => {
    expect(
      evidence("cloudflare-workers", { member: "edge", migrates: true }).rolloutDetail.floorReason,
    ).toBe("durable-object-migrations");
    expect(evidence("cloudflare-workers", { member: "edge", migrates: true }).rollout).toBe(false);
    const site = evidence("cloudflare-workers", { member: "docs", migrates: false });
    expect(site.rollout).toBe(false);
    expect(site.rolloutDetail).toMatchObject({ steps: [100], floorReason: "single-step" });
    expect(
      evidence("cloudflare-workers", { member: "edge", migrates: false, environment: "staging" })
        .rollout,
    ).toBe(false);
  });

  /** Encore has no rollout primitive; an unknown is never a true. */
  it("is false for another target and null for an unknown", () => {
    expect(evidence("encore-cloud")).toMatchObject({
      rollout: false,
      rolloutDetail: { kind: "all-at-once", steps: null, floorReason: "no-rollout-primitive" },
    });
    expect(evidence("eas").rollout).toBeNull();
    expect(evidence("cloudflare-workers").rollout).toBeNull();
    expect(evidence("cloudflare-workers", { member: "nope", migrates: false }).rollout).toBeNull();
    expect(evidence("cloudflare-workers", { member: "edge" })).toMatchObject({
      rollout: null,
      rolloutDetail: { floorReason: "undeclared" },
    });
  });

  /** The bot reads the sha to match the deployment; destructive stays floor until gen classifies migrations. */
  it("passes the commit, target and member through and leaves destructive null", () => {
    expect(evidence("cloudflare-workers", { member: "edge", migrates: false })).toMatchObject({
      schema: "runway.evidence/v1",
      repo: "figentra/pay",
      environment: "production",
      sha: SHA,
      target: "cloudflare-workers",
      member: "edge",
      destructive: null,
      destructiveMigrations: [],
    });
    expect(evidence("encore-cloud").member).toBeNull();
  });
});
