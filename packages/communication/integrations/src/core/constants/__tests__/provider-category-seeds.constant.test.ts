/**
 * Stackra file contract:
 * Purpose: unit tests of the managed-or-BYO seeds: every provider-category record is unique and names its own
 *          provisioning template when it has a managed source; the template pack holds one automation per managed
 *          category in the automation document shape; the catalogue lists the us and eu gateways with Stripe live.
 * Boundary: test only; pure data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; R3-CE-13; R3-SO-03; R4-4.
 */
import { describe, expect, it } from "@stackra/testing";

import { ProviderSource } from "#contracts/enums/provider-source.enum";
import { MANAGED_PROVISIONING_TEMPLATES } from "#core/constants/managed-provisioning-templates.constant";
import { PROVIDER_CATALOGUE_SEEDS } from "#core/constants/provider-catalogue-seeds.constant";
import { PROVIDER_CATEGORY_SEEDS } from "#core/constants/provider-category-seeds.constant";

describe("PROVIDER_CATEGORY_SEEDS", () => {
  it("holds one record per category, managed ones naming their template", () => {
    const keys = PROVIDER_CATEGORY_SEEDS.map((record) => record.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const record of PROVIDER_CATEGORY_SEEDS) {
      expect(record.key).toBe(`provider-category:${record.name}`);
      expect(record.sources.length).toBeGreaterThan(0);
      expect(record.managed !== undefined).toBe(record.sources.includes(ProviderSource.Managed));
      if (record.managed !== undefined)
        expect(record.managed.provisioning).toBe(
          `workflow-template:os:managed-provisioning:${record.name}`,
        );
    }
  });

  it("charges no fee for bringing your own payments", () => {
    const payments = PROVIDER_CATEGORY_SEEDS.find((record) => record.name === "payments");
    expect(payments?.byoPricing).toBeUndefined();
    expect(payments?.managed?.pricing).toBe("fee-schedule:pay");
  });
});

describe("MANAGED_PROVISIONING_TEMPLATES", () => {
  it("has one automation per managed category, in the automation document shape", () => {
    const managed = PROVIDER_CATEGORY_SEEDS.filter((record) => record.managed !== undefined);
    expect(MANAGED_PROVISIONING_TEMPLATES.key).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/);
    expect(MANAGED_PROVISIONING_TEMPLATES.templates).toHaveLength(managed.length);
    for (const template of MANAGED_PROVISIONING_TEMPLATES.templates) {
      expect(template.key).toMatch(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);
      for (const step of template.steps) expect(step.name).toMatch(/^[a-z][a-zA-Z0-9]{0,62}$/);
    }
    expect(MANAGED_PROVISIONING_TEMPLATES.templates.map((template) => template.key)).toContain(
      "managed_provisioning.tenant_verification",
    );
  });
});

describe("PROVIDER_CATALOGUE_SEEDS", () => {
  it("lists Stripe live and the planned gateways in us and eu", () => {
    const of = (pack: string) =>
      PROVIDER_CATALOGUE_SEEDS.filter((row) => row.pack === pack).map(
        (row) => `${row.provider}:${row.status}`,
      );
    expect(of("us")).toEqual(["stripe:live", "square:planned", "adyen:planned", "paypal:planned"]);
    expect(of("eu")).toEqual(["stripe:live", "adyen:planned", "mollie:planned"]);
  });
});
