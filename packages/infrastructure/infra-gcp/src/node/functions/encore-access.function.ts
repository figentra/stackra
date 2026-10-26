/**
 * Stackra file contract:
 * Purpose: `encoreAccess(name, args, opts)`, grants the Encore Cloud service account `ENCORE_ROLES` on the project a
 *          deployment's services run in, so Encore Cloud provisions them there without `roles/owner`.
 * Boundary: internal; grants roles only. The service account is Encore's (it shows it in the connect flow) and is
 *           runway data (`providers.gcp.encore.serviceAccount`, an email or `ref:<path>`); no key is made or held.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1), ADR 0289 (decision 5), ADR 0401, ADR 0435 (decision 1).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

import { ENCORE_ROLES } from "#node/constants/encore-roles.constant";

/**
 * The Encore Cloud service account's role bindings on `args.project`.
 *
 * @param args.serviceAccount - the Encore Cloud service account's email, already resolved.
 * @example
 * encoreAccess("acme-staging", { project: "acme-stg", serviceAccount: "encore@acme.iam.gserviceaccount.com" }, opts);
 */
export function encoreAccess(
  name: string,
  args: { project: string; serviceAccount: string },
  opts: pulumi.CustomResourceOptions,
): void {
  for (const role of ENCORE_ROLES)
    new gcp.projects.IAMMember(
      `${name}-encore-${role.slice("roles/".length).replaceAll(".", "-")}`,
      { project: args.project, role, member: `serviceAccount:${args.serviceAccount}` },
      opts,
    );
}
