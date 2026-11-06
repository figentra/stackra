/**
 * Stackra file contract:
 * Purpose: unit tests of `organizationLayout` under Pulumi's mocks: the organization is protected, units nest by path,
 *          policies attach to the root, a unit or an account, and an unknown parent or target fails.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172, ADR 0524.
 */
import { describe, expect, it } from "@stackra/testing";

import { organizationLayout } from "#node/functions/organization-layout.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import type { OrganizationLayoutArgs } from "#node/types/organization-layout-args.type";

const ARGS: OrganizationLayoutArgs = {
  servicePrincipals: ["sso.amazonaws.com"],
  policyTypes: ["SERVICE_CONTROL_POLICY"],
  rootFeatures: ["RootCredentialsManagement"],
  units: ["Workloads", "Workloads/me"],
  policies: {
    deny: {
      type: "SERVICE_CONTROL_POLICY",
      content: { Version: "2012-10-17", Statement: [] },
      targets: ["root", "Workloads/me", "111111111111"],
    },
  },
};

describe("organizationLayout", () => {
  it("nests a unit under its parent path", async () => {
    const engine = await mockPulumi();
    organizationLayout("org", ARGS, {});
    expect((await engine.find("OrganizationalUnit", "org-ou-workloads-me")).inputs).toMatchObject({
      name: "me",
      parentId: "org-ou-workloads-id",
    });
  });

  it("attaches a policy to an account id and a unit", async () => {
    const engine = await mockPulumi();
    organizationLayout("org", ARGS, {});
    expect(
      (await engine.find("PolicyAttachment", "org-attach-deny-111111111111")).inputs,
    ).toMatchObject({
      targetId: "111111111111",
    });
    expect(
      (await engine.find("PolicyAttachment", "org-attach-deny-workloads-me")).inputs,
    ).toMatchObject({
      targetId: "org-ou-workloads-me-id",
    });
    expect((await engine.find("Policy", "org-policy-deny")).inputs["content"]).toBe(
      '{"Version":"2012-10-17","Statement":[]}',
    );
  });

  it("turns on centralized root access", async () => {
    const engine = await mockPulumi();
    organizationLayout("org", ARGS, {});
    expect((await engine.find("OrganizationsFeatures", "org")).inputs["enabledFeatures"]).toEqual([
      "RootCredentialsManagement",
    ]);
  });

  it("fails on a unit listed before its parent, or an unknown target", async () => {
    await mockPulumi();
    expect(() => organizationLayout("org", { ...ARGS, units: ["Workloads/me"] }, {})).toThrow(
      TypeError,
    );
    expect(() =>
      organizationLayout(
        "org",
        {
          ...ARGS,
          policies: { x: { type: "SERVICE_CONTROL_POLICY", content: "{}", targets: ["Nope"] } },
        },
        {},
      ),
    ).toThrow(TypeError);
  });
});
