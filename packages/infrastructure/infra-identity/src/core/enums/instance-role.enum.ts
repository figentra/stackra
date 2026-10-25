/**
 * Stackra file contract:
 * Purpose: the instance-wide roles a seeded machine user may hold on ZITADEL, such as the organisation manager the
 *          identity service needs to create a tenant's organisation.
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are ZITADEL's instance member roles without
 *           their `IAM_` prefix, in snake_case; the Pulumi slice writes `IAM_<CODE>` (`org_manager` is
 *           `IAM_ORG_MANAGER`).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 3 and 5), ADR 0207 (decision 2: machine identities go through ZITADEL),
 *                     ADR 0241 (decision 5), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One instance member role. */
export const InstanceRole = Enum.of({
  /** Everything on the instance. */
  Owner: "owner",
  /** Read everything on the instance. */
  OwnerViewer: "owner_viewer",
  /** Create and manage every organisation. */
  OrgManager: "org_manager",
  /** Manage the users of every organisation. */
  UserManager: "user_manager",
  /** Act as an administrator through token exchange. */
  AdminImpersonator: "admin_impersonator",
  /** Act as an end user through token exchange (support access, ADR 0211). */
  EndUserImpersonator: "end_user_impersonator",
});

/** One of the codes above. */
export type InstanceRole = Enum.Value<typeof InstanceRole>;
