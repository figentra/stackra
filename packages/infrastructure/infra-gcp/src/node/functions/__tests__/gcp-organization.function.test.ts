/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpOrganization` under Pulumi's mocks: folders nest by path, a list policy and a boolean
 *          policy land on their parent, a project sits in its folder with delete protection, grants go to the
 *          right IAM resource, and an unknown folder fails.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354, ADR 0524.
 */
import { describe, expect, it } from "@stackra/testing";

import { gcpOrganization } from "#node/functions/gcp-organization.function";
import type { GcpOrganizationArgs } from "#node/types/gcp-organization-args.type";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

const ARGS: GcpOrganizationArgs = {
  organizationId: "123",
  folders: ["workloads", "workloads/ksa"],
  policies: [
    {
      target: "workloads/ksa",
      constraint: "gcp.resourceLocations",
      allowedValues: ["in:me-central2-locations"],
    },
    { target: "org", constraint: "iam.disableServiceAccountKeyCreation", enforce: true },
  ],
  projects: [
    { id: "acme-pay-ksa", name: "Pay KSA", folder: "workloads/ksa", billingAccount: "AAA-BBB" },
  ],
  grants: [
    { target: "org", role: "roles/viewer", member: "user:a@acme.example" },
    { target: "project:acme-pay-ksa", role: "roles/owner", member: "user:a@acme.example" },
    { target: "billing:AAA-BBB", role: "roles/billing.admin", member: "user:a@acme.example" },
    { target: "workloads", role: "roles/viewer", member: "group:ops@acme.example" },
  ],
};

describe("gcpOrganization", () => {
  it("nests a folder under its parent and protects it", async () => {
    const engine = await mockPulumi();
    gcpOrganization("gcp", ARGS, {});
    expect((await engine.find("Folder", "gcp-folder-workloads")).inputs).toMatchObject({
      displayName: "workloads",
      parent: "organizations/123",
      deletionProtection: true,
    });
    expect((await engine.find("Folder", "gcp-folder-workloads-ksa")).inputs["displayName"]).toBe(
      "ksa",
    );
  });

  it("puts a list policy on a folder and a boolean policy on the organization", async () => {
    const engine = await mockPulumi();
    gcpOrganization("gcp", ARGS, {});
    const ksa = await engine.find("Policy", "gcp-policy-workloads-ksa-gcp-resourcelocations");
    expect(ksa.inputs["spec"]).toEqual({
      rules: [{ values: { allowedValues: ["in:me-central2-locations"] } }],
    });
    const keys = await engine.find("Policy", "gcp-policy-org-iam-disableserviceaccountkeycreation");
    expect(keys.inputs).toMatchObject({
      name: "organizations/123/policies/iam.disableServiceAccountKeyCreation",
      parent: "organizations/123",
      spec: { rules: [{ enforce: "TRUE" }] },
    });
  });

  it("keeps a project's delete protection and billing account", async () => {
    const engine = await mockPulumi();
    gcpOrganization("gcp", ARGS, {});
    expect((await engine.find("Project", "gcp-project-acme-pay-ksa")).inputs).toMatchObject({
      projectId: "acme-pay-ksa",
      billingAccount: "AAA-BBB",
      deletionPolicy: "PREVENT",
    });
  });

  it("grants on the organization, a project, a billing account and a folder", async () => {
    const engine = await mockPulumi();
    const { projects } = gcpOrganization("gcp", ARGS, {});
    expect(Object.keys(projects)).toEqual(["acme-pay-ksa"]);
    const types = (await engine.settled()).map((resource) => resource.type);
    expect(types).toEqual(
      expect.arrayContaining([
        "gcp:organizations/iAMMember:IAMMember",
        "gcp:projects/iAMMember:IAMMember",
        "gcp:billing/accountIamMember:AccountIamMember",
        "gcp:folder/iAMMember:IAMMember",
      ]),
    );
  });

  it("fails on an unknown folder", async () => {
    await mockPulumi();
    expect(() => gcpOrganization("gcp", { ...ARGS, folders: ["workloads/ksa"] }, {})).toThrow(
      TypeError,
    );
  });
});
