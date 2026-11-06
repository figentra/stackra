/**
 * Stackra file contract:
 * Purpose: unit tests of the estate fields figentra/infra reads from the root runway (ADR 0524): an environment's
 *          `region` is one of me, eu and ksa; `providers.aws.budgets.monthlyUsd` defaults to 300 beside the open
 *          thresholds; `providers.cloudflare.records` takes non-Worker DNS records under a declared zone, refuses an MX
 *          without a priority, a proxied TXT and a name under no zone; `providers.aws.account` and
 *          `providers.gcp.project` are opt-ins that default to false, and `providers.gcp.apis` takes only unique
 *          `*.googleapis.com` names. `checkEnvironmentRegion` asks a product's staging and production for a region,
 *          asks a ksa environment for the GCP project, and skips a runway without `product`; `deprecatedFields` names
 *          `providers.aws.region`, `providers.aws.accounts` and an environment's `cloud`; `unusedCloudOptIns` names an
 *          AWS account no me or eu environment uses.
 * Boundary: test only; plain objects through `parseRunway` and the three checks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0524; STA-2104.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { checkEnvironmentRegion } from "#core/functions/check-environment-region.function";
import { deprecatedFields } from "#core/functions/deprecated-fields.function";
import { parseRunway } from "#core/functions/parse-runway.function";
import { unusedCloudOptIns } from "#core/functions/unused-cloud-opt-ins.function";

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

/** A product with production in ksa and `gcp` as its GCP provider block. */
const ksa = (gcp: Record<string, unknown>) =>
  root({
    environments: { staging: { region: "me" }, production: { region: "ksa" } },
    providers: { gcp },
  });

/** A product whose staging runs a `cls` cache node class in me. */
const cache = (cls: string) =>
  root({
    environments: {
      staging: { region: "me", shared: { cache: { mode: "nodes", class: cls } } },
      production: { region: "me" },
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

  it("opts in to no AWS account and no GCP project by default", () => {
    const parsed = parseRunway("root", root({ providers: { aws: {}, gcp: {} } }));
    expect(parsed.providers?.aws?.account).toBe(false);
    expect(parsed.providers?.gcp?.project).toBe(false);
  });

  it("takes unique *.googleapis.com services and refuses another name or a repeat", () => {
    const apis = ["aiplatform.googleapis.com", "run.googleapis.com"];
    expect(
      parseRunway("root", root({ providers: { gcp: { apis } } })).providers?.gcp?.apis,
    ).toEqual(apis);
    expect(pathsOf(root({ providers: { gcp: { apis: ["aiplatform"] } } }))).toEqual([
      "providers.gcp.apis.0",
    ]);
    expect(pathsOf(root({ providers: { gcp: { apis: [apis[0], apis[0]] } } }))).toEqual([
      "providers.gcp.apis",
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

  it("asks a ksa environment for the product's GCP project", () => {
    expect(checkEnvironmentRegion(parseRunway("root", ksa({}))).map(({ path }) => path)).toEqual([
      "environments.production.region",
    ]);
    expect(checkEnvironmentRegion(parseRunway("root", ksa({ project: true })))).toEqual([]);
  });
});

describe("checkEnvironmentRegion and the UAE cache", () => {
  it("refuses a t4g or m6g cache class in me and passes an m7g one", () => {
    expect(
      checkEnvironmentRegion(parseRunway("root", cache("cache.t4g.small"))).map(({ path }) => path),
    ).toEqual(["environments.staging.shared.cache.class"]);
    expect(checkEnvironmentRegion(parseRunway("root", cache("cache.m7g.large")))).toEqual([]);
  });
});

describe("the observability alerts and routes", () => {
  it("takes alert overrides and the four route forms, and refuses a Slack #name", () => {
    const observability = {
      alerts: { errorRate: { threshold: 5, window: "10m" }, budget: { forecastPercent: 70 } },
      notify: {
        critical: ["oncall", "email:ops@figentra.com", "slack:C07ABC1234"],
        warning: ["linear:STA"],
      },
    };
    expect(parseRunway("root", root({ observability })).observability).toEqual(observability);
    expect(pathsOf(root({ observability: { notify: { critical: ["slack:#ops"] } } }))).toEqual([
      "observability.notify.critical.0",
    ]);
    expect(pathsOf(root({ observability: { alerts: { dbCpu: { window: "15" } } } }))).toEqual([
      "observability.alerts.dbCpu.window",
    ]);
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

  it("takes a per-role monthly budget for one release and names it", () => {
    const old = root({
      providers: {
        aws: { budgets: { monthlyUsd: { nonprod: "ref:aws.budgets.nonprod", prod: 2000 } } },
      },
    });
    expect(deprecatedFields(parseRunway("root", old)).map(({ path }) => path)).toEqual([
      "providers.aws.budgets.monthlyUsd",
    ]);
  });

  it("names an environment's cloud", () => {
    const old = root({
      environments: {
        staging: { region: "me", cloud: { name: "aws", account: "nonprod" } },
        production: { region: "me" },
      },
    });
    expect(deprecatedFields(parseRunway("root", old)).map(({ path }) => path)).toEqual([
      "environments.staging.cloud",
    ]);
  });
});

describe("unusedCloudOptIns", () => {
  it("names an AWS account no me or eu environment uses", () => {
    const ksaOnly = root({
      environments: { staging: { region: "ksa" }, production: { region: "ksa" } },
      providers: { aws: { account: true }, gcp: { project: true } },
    });
    expect(unusedCloudOptIns(parseRunway("root", ksaOnly)).map(({ path }) => path)).toEqual([
      "providers.aws.account",
    ]);
    expect(
      unusedCloudOptIns(parseRunway("root", root({ providers: { aws: { account: true } } }))),
    ).toEqual([]);
  });
});
