/**
 * Stackra file contract:
 * Purpose: unit and type tests of `defineService`: it returns its argument unchanged, takes the template's service
 *          definitions, and refuses an option a service does not have or a runner outside `MigrationRunner`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { ApiArea } from "#core/enums/api-area.enum";
import { MigrationRunner } from "#core/enums/migration-runner.enum";
import { Target } from "#core/enums/target.enum";
import { defineService } from "#core/functions/define-service.function";

describe("defineService", () => {
  it("returns the definition unchanged, as the template's commerce service writes it", () => {
    const definition = {
      area: ApiArea.App,
      health: { path: "/healthz", checks: ["pricing-provider"] },
      e2e: { seeds: ["catalogue.demo", "inventory.demo", "loyalty_kit.demo", "orders.demo"] },
      migrations: { runner: MigrationRunner.Auto },
    };
    expect(defineService(definition)).toBe(definition);
  });

  it("refuses an app option and an unknown runner", () => {
    // @ts-expect-error -- a service has no build targets
    const withTargets = defineService({ area: ApiArea.App, targets: [Target.Web] });
    // @ts-expect-error -- "encore" is not a MigrationRunner
    const encore = defineService({ area: ApiArea.App, migrations: { runner: "encore" } });
    expect([withTargets.area, encore.area]).toEqual(["app", "app"]);
  });
});
