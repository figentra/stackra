/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreAccess` under Pulumi's mocks: the Encore Cloud service account gets each of
 *          `ENCORE_ROLES` on the project, one binding per role, and never `roles/owner`.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1), ADR 0435.
 */
import { describe, expect, it } from "@stackra/testing";

import { ENCORE_ROLES } from "#node/constants/encore-roles.constant";
import { encoreAccess } from "#node/functions/encore-access.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** The Encore Cloud service account. */
const ENCORE = "encore-acme@encore-cloud.iam.gserviceaccount.com";

describe("encoreAccess", () => {
  it("binds each Encore role on the project to the Encore service account", async () => {
    const engine = await mockPulumi();
    encoreAccess("acme-staging", { project: "acme-stg", serviceAccount: ENCORE }, {});

    expect((await engine.find("IAMMember", "acme-staging-encore-run-admin")).inputs).toEqual({
      project: "acme-stg",
      role: "roles/run.admin",
      member: `serviceAccount:${ENCORE}`,
    });
    const roles = (await engine.settled()).map((resource) => resource.inputs["role"]);
    expect(roles).toEqual([...ENCORE_ROLES]);
    expect(roles).not.toContain("roles/owner");
  });
});
