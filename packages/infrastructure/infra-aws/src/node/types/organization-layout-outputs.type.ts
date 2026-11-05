/**
 * Stackra file contract:
 * Purpose: `OrganizationLayoutOutputs`, what `organizationLayout` returns: the organization, its root id, and the
 *          units and policies by path and name, so an accounts stack can place accounts by unit path.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172, ADR 0524.
 */
import type * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

/** The layout's resources. */
export interface OrganizationLayoutOutputs {
  readonly organization: aws.organizations.Organization;
  readonly rootId: pulumi.Output<string>;
  readonly units: Readonly<Record<string, aws.organizations.OrganizationalUnit>>;
  readonly policies: Readonly<Record<string, aws.organizations.Policy>>;
}
