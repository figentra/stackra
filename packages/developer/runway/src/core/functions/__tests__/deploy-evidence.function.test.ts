/**
 * Stackra file contract:
 * Purpose: unit tests of `deployEvidence`: `rollout` is judged per target. A production Workers member with traffic
 *          steps and no Durable Object migration is true; a migrating member, a single-step member and a staging
 *          deploy are false; another declared target is false (no rollout primitive); an undeclared target, a missing
 *          member or an unread wrangler config is null. `destructive` is judged per target: a service target from the
 *          migration streams (`destructiveOf`), a client target false, a Workers member false only with a read config
 *          that neither migrates nor binds D1, an undeclared target null; the commit, target and member pass through.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); ADR 0519 (decision 2); ADR 0159 (decision 3);
 *                     STA-2104; STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { deployEvidence } from "#core/functions/deploy-evidence.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import type { DeployMigrations } from "#core/types/deploy-migrations.type";
import type { MigrationStream } from "#core/types/migration-stream.type";

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
    eas: {},
  },
});

/** A billing service whose second migration drops a column. */
const BILLING: MigrationStream = {
  member: "billing",
  safety: {
    schema: "stackra.migration-safety/v1",
    migrations: [
      { id: "billing.0001_create", destructive: false, files: ["0001_billing_0001_create"] },
      { id: "billing.0002_drop_note", destructive: true, files: ["0002_billing_0002_drop_note"] },
    ],
  },
  compiled: ["0001_billing_0001_create", "0002_billing_0002_drop_note"],
};

/** The evidence of one job. */
const evidence = (
  target: string,
  extra: {
    member?: string;
    migrates?: boolean;
    d1?: boolean;
    environment?: string;
    migrations?: DeployMigrations;
  } = {},
) =>
  deployEvidence(ROOT, {
    repo: "figentra/pay",
    environment: extra.environment ?? "production",
    sha: SHA,
    target,
    member: extra.member,
    migrates: extra.migrates,
    d1: extra.d1,
    migrations: extra.migrations,
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
    expect(evidence("eas").rollout).toBe(false);
    expect(evidence("helm").rollout).toBeNull();
    expect(evidence("cloudflare-workers").rollout).toBeNull();
    expect(evidence("cloudflare-workers", { member: "nope", migrates: false }).rollout).toBeNull();
    expect(evidence("cloudflare-workers", { member: "edge" })).toMatchObject({
      rollout: null,
      rolloutDetail: { floorReason: "undeclared" },
    });
  });

  /** The bot reads the sha to match the deployment; a Workers config not proven free of migrations stays floor. */
  it("passes the commit, target and member through", () => {
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

  /** A service target ships its services' migrations, judged against what the previous deploy shipped. */
  it("judges a service target's destructive from its migration streams", () => {
    expect(
      evidence("encore-cloud", {
        migrations: { streams: [BILLING], previous: ["billing:billing.0001_create"] },
      }),
    ).toMatchObject({ destructive: true, destructiveMigrations: ["billing.0002_drop_note"] });
    expect(
      evidence("encore-cloud", {
        migrations: {
          streams: [BILLING],
          previous: ["billing:billing.0001_create", "billing:billing.0002_drop_note"],
        },
      }),
    ).toMatchObject({ destructive: false, destructiveMigrations: [] });
    expect(evidence("encore-cloud", { migrations: { streams: [BILLING] } }).destructive).toBeNull();
    expect(evidence("encore-cloud").destructive).toBeNull();
  });

  /** An app, docs site or package ships no database; an undeclared target is unknown. */
  it("is false for a client target and null for an undeclared one", () => {
    expect(evidence("eas")).toMatchObject({ destructive: false, destructiveMigrations: [] });
    expect(evidence("helm", { migrations: { streams: [] } }).destructive).toBeNull();
  });

  /** A Durable Object migration may delete a class's data and D1 migrates outside gen, so only a clean config is false. */
  it("is false for a Workers member only when its config neither migrates nor binds D1", () => {
    expect(
      evidence("cloudflare-workers", { member: "edge", migrates: false, d1: false }).destructive,
    ).toBe(false);
    expect(
      evidence("cloudflare-workers", { member: "edge", migrates: true, d1: false }).destructive,
    ).toBeNull();
    expect(
      evidence("cloudflare-workers", { member: "edge", migrates: false, d1: true }).destructive,
    ).toBeNull();
    expect(evidence("cloudflare-workers", { member: "edge" }).destructive).toBeNull();
  });
});
