/**
 * Stackra file contract:
 * Purpose: unit tests of the estate fields figentra/infra reads from the root runway (ADR 0524): an environment's
 *          `region` is one of me, eu and ksa; `providers.aws.budgets.monthlyUsd` defaults to 300 beside the open
 *          thresholds; `providers.cloudflare.records` takes non-Worker DNS records under a declared zone, refuses an MX
 *          without a priority, a proxied TXT and a name under no zone. `checkEnvironmentRegion` asks a product's
 *          staging and production for a region and skips a runway without `product`; `deprecatedFields` names
 *          `providers.aws.region` and `providers.aws.accounts`.
 * Boundary: test only; plain objects through `parseRunway` and the two checks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0524; STA-2104.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkEnvironmentRegion } from "#core/functions/check-environment-region.function";
import { deprecatedFields } from "#core/functions/deprecated-fields.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A product root runway with `extra` merged in. */
function root(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 3,
    project: "figentra-pay",
    product: { key: "pay" },
    environments: { staging: { region: "me" }, production: { region: "me" } },
    providers: { cloudflare: { zones: { "figentra.com": "ref:cloudflare.zones.figentra" } } },
    ...extra,
  };
}

/** The issue paths of a refused document. */
function pathsOf(document: unknown): string[] {
  try {
    parseRunway("root", document);
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map(({ path }) => path);
    throw error;
  }
  return [];
}

const records = (list: unknown[]) =>
  root({
    providers: {
      cloudflare: { zones: { "figentra.com": "ref:cloudflare.zones.figentra" }, records: list },
    },
  });

describe("the root runway's estate fields", () => {
  it("takes a region key per environment and refuses another", () => {
    expect(parseRunway("root", root()).environments.staging?.region).toBe("me");
    expect(pathsOf(root({ environments: { staging: { region: "us" } } }))).toEqual([
      "environments.staging.region",
    ]);
  });

  it("defaults the monthly budget to 300 and keeps the thresholds", () => {
    const parsed = parseRunway(
      "root",
      root({ providers: { aws: { budgets: { thresholds: [50, 80, 100] } } } }),
    );
    expect(parsed.providers?.aws?.budgets).toEqual({ thresholds: [50, 80, 100], monthlyUsd: 300 });
    expect(pathsOf(root({ providers: { aws: { budgets: { monthlyUsd: 0 } } } }))).toEqual([
      "providers.aws.budgets.monthlyUsd",
    ]);
  });

  it("takes DNS records under a declared zone", () => {
    const list = [
      { name: "_dmarc.pay.figentra.com", type: "TXT", content: "v=DMARC1; p=reject" },
      { name: "pay.figentra.com", type: "MX", content: "mx.example.net", priority: 10 },
      { name: "www.pay.figentra.com", type: "CNAME", content: "pay.figentra.com", proxied: true },
    ];
    expect(parseRunway("root", records(list)).providers?.cloudflare?.records).toEqual(list);
  });

  it("refuses an MX without a priority and a proxied TXT", () => {
    expect(
      pathsOf(
        records([
          { name: "pay.figentra.com", type: "MX", content: "mx.example.net" },
          { name: "pay.figentra.com", type: "TXT", content: "x", proxied: true },
        ]),
      ),
    ).toEqual([
      "providers.cloudflare.records.0.priority",
      "providers.cloudflare.records.1.proxied",
    ]);
  });

  // The zone check is the root's refinement, which zod runs only once every record parses.
  it("refuses a record whose name is under no declared zone", () => {
    expect(pathsOf(records([{ name: "pay.example.org", type: "TXT", content: "x" }]))).toEqual([
      "providers.cloudflare.records.0.name",
    ]);
  });
});

describe("checkEnvironmentRegion", () => {
  it("passes a product whose staging and production name a region", () => {
    expect(checkEnvironmentRegion(parseRunway("root", root()))).toEqual([]);
  });

  it("names each product environment without a region, and skips a runway without product", () => {
    const missing = root({ environments: { staging: {}, production: {} } });
    expect(checkEnvironmentRegion(parseRunway("root", missing)).map(({ path }) => path)).toEqual([
      "environments.staging.region",
      "environments.production.region",
    ]);
    const { product: _product, ...core } = missing;
    expect(checkEnvironmentRegion(parseRunway("root", core))).toEqual([]);
  });
});

describe("deprecatedFields", () => {
  it("names providers.aws.region and providers.aws.accounts, and nothing else", () => {
    const old = root({
      providers: { aws: { region: "me-central-1", accounts: { prod: "ref:aws.accounts.prod" } } },
    });
    expect(deprecatedFields(parseRunway("root", old)).map(({ path }) => path)).toEqual([
      "providers.aws.region",
      "providers.aws.accounts",
    ]);
    expect(deprecatedFields(parseRunway("root", root()))).toEqual([]);
  });
});
