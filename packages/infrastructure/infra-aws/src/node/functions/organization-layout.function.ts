/**
 * Stackra file contract:
 * Purpose: `organizationLayout(name, args, opts)`, an AWS Organization as code: the organization's trusted services
 *          and policy types, centralized root access, the organizational units (as paths, `Workloads/me`), and the
 *          organization policies (SCPs, RCPs, tag policies) with the root, units or accounts they attach to.
 * Boundary: runs in the management account. The organization itself is protected and retained on delete: removing it
 *           from the program never deletes it. AWS's default `FullAWSAccess` attachments are not modelled. Ids are the
 *           caller's; nothing here names an account.
 * Runtime: node
 * Governing contract: ADR 0172 (decisions 1 and 2), ADR 0524 (the organization layout and its SCPs).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

import type { OrganizationLayoutArgs } from "#node/types/organization-layout-args.type";
import type { OrganizationLayoutOutputs } from "#node/types/organization-layout-outputs.type";

/** A path's logical-name part: `Workloads/me` → `workloads-me`. */
const slug = (path: string): string => path.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

/**
 * Declares the organization layout: trusted services, policy types, root access, units and policies.
 *
 * @throws TypeError when a unit's parent path is not listed before it, or a policy targets an unknown unit.
 * @example
 * organizationLayout("org", { servicePrincipals: ["sso.amazonaws.com"], policyTypes: ["SERVICE_CONTROL_POLICY"],
 *   units: ["Workloads", "Workloads/me"], policies: { "region-me": { type: "SERVICE_CONTROL_POLICY",
 *   content: regionLock({ sid: "OnlyMeCentral1", regions: ["me-central-1"], exempt: [] }), targets: ["Workloads/me"] } } }, {});
 */
export function organizationLayout(
  name: string,
  args: OrganizationLayoutArgs,
  opts: pulumi.CustomResourceOptions,
): OrganizationLayoutOutputs {
  const organization = new aws.organizations.Organization(
    name,
    {
      featureSet: "ALL",
      awsServiceAccessPrincipals: [...args.servicePrincipals],
      enabledPolicyTypes: [...args.policyTypes],
    },
    { ...opts, protect: true, retainOnDelete: true },
  );
  if (args.rootFeatures !== undefined && args.rootFeatures.length > 0)
    new aws.iam.OrganizationsFeatures(
      name,
      { enabledFeatures: [...args.rootFeatures] },
      { ...opts, dependsOn: [organization] },
    );
  const rootId = organization.roots.apply((roots) => roots[0]?.id ?? "");

  const units: Record<string, aws.organizations.OrganizationalUnit> = {};
  for (const path of args.units) {
    const parts = path.split("/");
    const parentPath = parts.slice(0, -1).join("/");
    const parent = parentPath === "" ? undefined : units[parentPath];
    if (parentPath !== "" && parent === undefined)
      throw new TypeError(`unit ${path}: list its parent ${parentPath} before it`);
    units[path] = new aws.organizations.OrganizationalUnit(
      `${name}-ou-${slug(path)}`,
      { name: parts.at(-1) ?? path, parentId: parent?.id ?? rootId },
      opts,
    );
  }

  const policies: Record<string, aws.organizations.Policy> = {};
  for (const [policyName, policy] of Object.entries(args.policies)) {
    policies[policyName] = new aws.organizations.Policy(
      `${name}-policy-${policyName}`,
      {
        name: policyName,
        type: policy.type,
        description: policy.description,
        content:
          typeof policy.content === "string" ? policy.content : JSON.stringify(policy.content),
      },
      { ...opts, dependsOn: [organization] },
    );
    for (const target of policy.targets) {
      const targetId =
        target === "root" ? rootId : /^\d{12}$/.test(target) ? target : units[target]?.id;
      if (targetId === undefined)
        throw new TypeError(`policy ${policyName}: unknown target ${target}`);
      new aws.organizations.PolicyAttachment(
        `${name}-attach-${policyName}-${slug(target)}`,
        { policyId: policies[policyName].id, targetId },
        opts,
      );
    }
  }
  return { organization, rootId, units, policies };
}
