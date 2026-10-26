/**
 * Stackra file contract:
 * Purpose: unit tests of `promote`: staging's running commit ships to production's KSA services, its dedicated tenant
 *          and its mobile build; a given commit wins; a target environment not deployed by promotion and a source
 *          that runs nothing are refused.
 * Boundary: test only; the providers are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170 (decision 6), ADR 0352, ADR 0400.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { promote } from "#core/functions/promote.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import { FakeProvider } from "#core/functions/__tests__/fixtures/fake-provider.fixture";

const STAGED = "b".repeat(40);

describe("promote", () => {
  it("ships what staging runs to every production target", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");
    encore.running.set("staging/services/uae", STAGED);

    await promote(DEPLOY_ROOT, "staging", "production", [encore, eas]);

    expect(encore.calls).toEqual([
      `apply production/services/ksa ${STAGED}`,
      `apply production/services/ksa/dedicated:firm ${STAGED}`,
    ]);
    expect(eas.calls).toEqual([`apply production/mobile/ksa ${STAGED}`]);
  });

  it("ships the commit it is given", async () => {
    const encore = new FakeProvider("encore-cloud");
    const eas = new FakeProvider("eas");
    const sha = "c".repeat(40);
    await promote(DEPLOY_ROOT, "staging", "production", [encore, eas], sha);
    expect(encore.running.get("production/services/ksa")).toBe(sha);
  });

  it("refuses an environment not deployed by promotion and a source that runs nothing", async () => {
    const encore = new FakeProvider("encore-cloud");
    await expect(promote(DEPLOY_ROOT, "production", "staging", [encore])).rejects.toThrow(
      RunwayInvalidError,
    );
    await expect(promote(DEPLOY_ROOT, "staging", "production", [encore])).rejects.toThrow(
      RunwayUnresolvedError,
    );
  });
});
