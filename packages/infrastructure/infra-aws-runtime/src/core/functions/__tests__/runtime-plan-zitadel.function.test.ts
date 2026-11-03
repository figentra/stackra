/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimePlan` over the first workload user, self-hosted ZITADEL with its Postgres resource
 *          (STA-1649): the declaration the runbook shows plans in dev, staging and production within each cap, starts
 *          ZITADEL with its own arguments and hands it the database URL under the name it reads; an alias naming a
 *          variable no used Postgres resource publishes is refused with its path.
 * Boundary: test only; parsed runway objects in, plain data out. Nothing is declared or applied.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 1 to 5); ADR 0206 (decision 4 as amended by
 *                     0493); spec sta-1640 (L9).
 */
import { describe, expect, it } from "@stackra/testing";
import { parseRunway, RunwayInvalidError } from "@stackra/runway";

import { runtimePlan } from "#core/functions/runtime-plan.function";

const IMAGE = `ghcr.io/zitadel/zitadel@sha256:${"d".repeat(64)}`;

/** The runbook's ZITADEL declaration, with `aliases` replaced when given. */
function zitadelRunway(
  aliases: Record<string, string> = { ZITADEL_DATABASE_POSTGRES_DSN: "IDENTITY_DB_URL" },
) {
  return parseRunway("root", {
    version: 3,
    project: "figentra-os",
    environments: { dev: {}, staging: {}, production: {} },
    resources: {
      "identity-db": { kind: "postgres", size: { production: "medium" } },
    },
    workloads: {
      zitadel: {
        image: IMAGE,
        command: ["start-from-init", "--masterkeyFromEnv", "--tlsMode", "external"],
        port: 8080,
        health: "/debug/healthz",
        expose: "public",
        uses: ["identity-db"],
        env: {
          ZITADEL_EXTERNALDOMAIN: "login.me.example.com",
          ZITADEL_EXTERNALPORT: "443",
          ZITADEL_EXTERNALSECURE: "true",
        },
        aliases,
        secrets: ["ZITADEL_MASTERKEY"],
        size: { staging: "medium", production: "medium" },
        scale: { production: { min: 2, max: 4 } },
        reason: "Residency: KSA in-country tenants cannot use ZITADEL Cloud",
      },
    },
  });
}

describe("runtimePlan for self-hosted ZITADEL", () => {
  // @covers sta-1640:FR-002
  // @covers sta-1640:FR-006
  // @covers sta-1640:FR-009
  it("plans ZITADEL and its database in every environment within the caps", () => {
    const plans = (["dev", "staging", "production"] as const).map((environment) =>
      runtimePlan(zitadelRunway(), {}, environment),
    );

    expect(plans.map((plan) => [plan.cost.monthlyUsd, plan.cost.limit])).toEqual([
      [45 + 10 + 20, 150],
      [45 + 40 + 20, 500],
      [100 + 40 * 2 + 20, undefined],
    ]);
    expect(plans.map((plan) => plan.databases[0]?.consumers)).toEqual([
      ["zitadel"],
      ["zitadel"],
      ["zitadel"],
    ]);
    expect(plans[2]?.workloads[0]).toMatchObject({
      name: "figentra-os-production-zitadel",
      image: IMAGE,
      command: ["start-from-init", "--masterkeyFromEnv", "--tlsMode", "external"],
      public: true,
      aliases: { ZITADEL_DATABASE_POSTGRES_DSN: "IDENTITY_DB_URL" },
      secrets: ["ZITADEL_MASTERKEY"],
      cpu: 1024,
      memoryMb: 2048,
      scale: { min: 2, max: 4 },
    });
  });

  // @covers sta-1640:FR-010
  it("refuses an alias of a variable no used Postgres resource publishes", () => {
    const refused = (): unknown =>
      runtimePlan(zitadelRunway({ ZITADEL_DATABASE_POSTGRES_DSN: "MAIN_DB_URL" }), {}, "dev");

    expect(refused).toThrow(RunwayInvalidError);
    expect(refused).toThrow(/MAIN_DB_URL is not a variable of a Postgres resource/);
  });
});
