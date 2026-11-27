/**
 * Stackra file contract:
 * Purpose: hold `placeRegion` and `starterRegion` to their contract: a root runway placed in an AWS region id names it
 *          on staging and production, deploys to it alone, declares it in `regions` (dropping the starter's `me`),
 *          moves the deprecated `providers.aws.region` with it and keeps every comment; a Google Cloud region also
 *          switches `targets.encore-cloud.cloud` and drops `providers.aws.region`; the placed file passes the runway
 *          schema and `checkEnvironmentRegion` (a GCP one once a project is named); `starterRegion` reads staging's
 *          region, else the first deploy key, and nothing from a missing file.
 * Boundary: pure functions on in-memory text; runs no command.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0515 (decision 3); ADR 0524 (amendment 2026-11-27, STA-2896).
 */
import assert from "node:assert/strict";

import { checkEnvironmentRegion, checkRegions, parseRunway, resolveRegion } from "@stackra/runway";
import { test } from "@stackra/testing";
import { parse } from "yaml";

import { placeRegion } from "#node/create/functions/place-region.function";
import { starterRegion } from "#node/create/functions/starter-region.function";

/** The starter's root runway, cut to what placement touches. */
const STARTER = `version: 3
project: acme-platform
product:
  key: acme
providers:
  aws:
    # One region (Stackra ADR 0186).
    region: me-central-1
# ── Regions ──
regions:
  me:
    cloud: aws
    location: me-central-1
environments:
  dev:
    # The region platform hosts send API calls to.
    regions: [me]
  staging:
    regions: [me]
    encore:
      env: staging
  production:
    encore:
      env: production
    regions: [me]
targets:
  encore-cloud:
    cloud: aws
`;

const encoder = new TextEncoder();

/** One environment, as far as placement goes. */
type PlacedEnvironment = {
  readonly region?: string;
  readonly regions?: string[];
  readonly tier?: string;
};

/** The parts of a root runway these tests read. */
type Placed = {
  readonly environments: Record<"dev" | "staging" | "production", PlacedEnvironment>;
  readonly regions?: Record<string, unknown>;
  readonly providers: { readonly aws: { readonly region?: string } };
  readonly targets: { readonly "encore-cloud": { readonly cloud?: string } };
};

/** The runway text, parsed. */
const placedOf = (text: string): Placed => parse(text) as Placed;

/** An app's files holding `runway` as its root runway, or none. */
const files = (runway?: string) =>
  new Map(runway === undefined ? [] : [["runway.yaml", encoder.encode(runway)]]);

test("an AWS region id places staging and production there and keeps the comments", () => {
  const region = resolveRegion({}, "us-east-1");
  assert.ok(region);
  const text = placeRegion(STARTER, region);
  const placed = placedOf(text);
  assert.equal(placed.environments.staging.region, "us-east-1");
  assert.equal(placed.environments.production.region, "us-east-1");
  assert.equal(placed.environments.dev.region, undefined);
  for (const name of ["dev", "staging", "production"] as const)
    assert.deepEqual(placed.environments[name].regions, ["us-east-1"]);
  assert.deepEqual(placed.regions, { "us-east-1": { cloud: "aws", location: "us-east-1" } });
  assert.equal(placed.providers.aws.region, "us-east-1");
  assert.equal(placed.targets["encore-cloud"].cloud, "aws");
  assert.match(text, /# One region \(Stackra ADR 0186\)\./);
  assert.match(text, /# The region platform hosts send API calls to\./);
  assert.match(text, /# ── Regions ──/);
  assert.match(text, /  staging:\n    region: us-east-1\n    regions: \[us-east-1\]\n/);
  assert.doesNotMatch(text, /me-central-1/);
  const root = parseRunway("root", placed);
  assert.deepEqual(checkEnvironmentRegion(root), []);
  assert.deepEqual(checkRegions(root), []);
});

test("a Google Cloud region switches Encore's cloud and drops the AWS region", () => {
  const region = resolveRegion({}, "europe-west1");
  assert.ok(region);
  const placed = placedOf(placeRegion(STARTER, region));
  assert.equal(placed.environments.production.region, "europe-west1");
  assert.deepEqual(placed.regions, { "europe-west1": { cloud: "gcp", location: "europe-west1" } });
  assert.equal(placed.targets["encore-cloud"].cloud, "gcp");
  assert.equal(placed.providers.aws.region, undefined);
  const withProject = { ...placed, providers: { gcp: { projects: { production: "acme-prod" } } } };
  const root = parseRunway("root", withProject);
  assert.deepEqual(checkEnvironmentRegion(root), []);
  assert.deepEqual(checkRegions(root), []);
  assert.deepEqual(
    checkEnvironmentRegion(parseRunway("root", placed)).map(({ path }) => path),
    ["environments.staging.region", "environments.production.region"],
  );
});

test("a preset keeps its jurisdiction, and placing the starter's own region changes nothing", () => {
  const ksa = resolveRegion({}, "ksa");
  assert.ok(ksa);
  const placed = placedOf(placeRegion(STARTER, ksa));
  assert.deepEqual(placed.regions, {
    ksa: { cloud: "gcp", location: "me-central2", jurisdiction: "sa" },
  });
  const me = resolveRegion(parse(STARTER) as { regions: never }, "me");
  assert.ok(me);
  const same = placedOf(placeRegion(STARTER, me));
  assert.deepEqual(same.regions, { me: { cloud: "aws", location: "me-central-1" } });
  assert.equal(same.providers.aws.region, "me-central-1");
});

test("a runway without a regions section gets only the environment's region", () => {
  const bare =
    "product:\n  key: acme\nenvironments:\n  staging: {}\n  production:\n    tier: launch\n";
  const region = resolveRegion({}, "ap-south-1");
  assert.ok(region);
  const placed = placedOf(placeRegion(bare, region));
  assert.equal(placed.environments.staging.region, "ap-south-1");
  assert.deepEqual(placed.environments.production, { region: "ap-south-1", tier: "launch" });
  assert.equal(placed.regions, undefined);
});

test("starterRegion reads staging's region, else the first deploy key, else nothing", () => {
  assert.deepEqual(starterRegion(files(STARTER)), {
    name: "me",
    regions: { me: { cloud: "aws", location: "me-central-1" } },
  });
  assert.equal(
    starterRegion(files("environments:\n  staging:\n    region: eu\n    regions: [me]\n")).name,
    "eu",
  );
  assert.deepEqual(starterRegion(files()), { name: undefined, regions: {} });
  assert.deepEqual(starterRegion(files(": not yaml: [")), { name: undefined, regions: {} });
});
