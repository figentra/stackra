/**
 * Stackra file contract:
 * Purpose: `gcpOrganization(name, args, opts)`, a GCP organization's layer as code: folders by path, organization
 *          policies on the organization or a folder, projects in their folders with their billing account, and IAM
 *          members on the organization, folders, projects and billing accounts.
 * Boundary: the organization and billing accounts are named by id, never created. Projects are protected and keep
 *           GCP's delete protection (`deletionPolicy: PREVENT`); removing a project from the list never deletes it.
 *           Grants are non-authoritative members, so service agents' bindings are left alone. No ids in here.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3: one project per product and region), ADR 0524 (the GCP organization).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import type { GcpOrganizationArgs } from "#node/types/gcp-organization-args.type";

/** A logical-name part: `workloads/ksa` → `workloads-ksa`. */
const slug = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

/**
 * The organization layer.
 *
 * @throws TypeError when a folder's parent is not listed before it, or a policy, project or grant names an unknown
 *         folder.
 * @example
 * gcpOrganization("gcp", { organizationId: "123", folders: ["workloads", "workloads/ksa"], policies: [{ target:
 *   "workloads/ksa", constraint: "gcp.resourceLocations", allowedValues: ["in:me-central2-locations"] }], projects: [],
 *   grants: [] }, {});
 */
export function gcpOrganization(
  name: string,
  args: GcpOrganizationArgs,
  opts: pulumi.CustomResourceOptions,
): {
  folders: Record<string, gcp.organizations.Folder>;
  projects: Record<string, gcp.organizations.Project>;
} {
  const org = `organizations/${args.organizationId}`;
  const folders: Record<string, gcp.organizations.Folder> = {};
  const parentOf = (path: string, what: string): pulumi.Input<string> => {
    if (path === "org") return org;
    const folder = folders[path];
    if (folder === undefined) throw new TypeError(`${what}: unknown folder ${path}`);
    return folder.name;
  };

  for (const path of args.folders) {
    const parts = path.split("/");
    const parent = parts.length === 1 ? "org" : parts.slice(0, -1).join("/");
    folders[path] = new gcp.organizations.Folder(
      `${name}-folder-${slug(path)}`,
      {
        displayName: parts.at(-1) ?? path,
        parent: parentOf(parent, `folder ${path}`),
        deletionProtection: true,
      },
      { ...opts, protect: true },
    );
  }

  for (const policy of args.policies) {
    const parent = parentOf(policy.target, `policy ${policy.constraint}`);
    const values =
      policy.allowedValues === undefined && policy.deniedValues === undefined
        ? undefined
        : {
            ...(policy.allowedValues !== undefined && { allowedValues: [...policy.allowedValues] }),
            ...(policy.deniedValues !== undefined && { deniedValues: [...policy.deniedValues] }),
          };
    new gcp.orgpolicy.Policy(
      `${name}-policy-${slug(policy.target)}-${slug(policy.constraint)}`,
      {
        name: pulumi.interpolate`${parent}/policies/${policy.constraint}`,
        parent,
        spec: {
          rules: [
            values === undefined
              ? { enforce: policy.enforce === false ? "FALSE" : "TRUE" }
              : { values },
          ],
        },
      },
      opts,
    );
  }

  const projects: Record<string, gcp.organizations.Project> = {};
  for (const project of args.projects) {
    const parent = parentOf(project.folder, `project ${project.id}`);
    projects[project.id] = new gcp.organizations.Project(
      `${name}-project-${project.id}`,
      {
        projectId: project.id,
        name: project.name,
        ...(project.folder === "org"
          ? { orgId: args.organizationId }
          : { folderId: pulumi.output(parent).apply((folder) => folder.replace("folders/", "")) }),
        ...(project.billingAccount !== undefined && { billingAccount: project.billingAccount }),
        ...(project.labels !== undefined && { labels: { ...project.labels } }),
        deletionPolicy: "PREVENT",
      },
      // Not readable after creation, so an imported project would always show a diff.
      { ...opts, protect: true, ignoreChanges: ["autoCreateNetwork"] },
    );
  }

  for (const grant of args.grants) {
    const id = `${name}-grant-${slug(grant.target)}-${slug(grant.role)}-${slug(grant.member)}`;
    const member = { role: grant.role, member: grant.member };
    if (grant.target === "org")
      new gcp.organizations.IAMMember(id, { orgId: args.organizationId, ...member }, opts);
    else if (grant.target.startsWith("project:")) {
      const projectId = grant.target.slice("project:".length);
      new gcp.projects.IAMMember(
        id,
        { project: projects[projectId]?.projectId ?? projectId, ...member },
        opts,
      );
    } else if (grant.target.startsWith("billing:"))
      new gcp.billing.AccountIamMember(
        id,
        { billingAccountId: grant.target.slice("billing:".length), ...member },
        opts,
      );
    else
      new gcp.folder.IAMMember(
        id,
        { folder: parentOf(grant.target, `grant ${grant.role}`), ...member },
        opts,
      );
  }
  return { folders, projects };
}
