/**
 * Stackra file contract:
 * Purpose: `ProductAccountArgs`, one vended account: its name and root email, its unit, the region it opts in to,
 *          its monthly budget, and the sign-in roles granted to a person.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172 (decisions 1, 2 and 5), ADR 0354 (decision 2: one account per product and region).
 */
import type * as pulumi from "@pulumi/pulumi";

import type { AccessPrincipal } from "#node/types/access-principal.type";
import type { AccessRole } from "#node/types/access-role.type";
import type { BudgetAlert } from "#node/types/budget-alert.type";

/** One vended account. */
export interface ProductAccountArgs {
  /** The account name AWS shows (`acme-pay-me`). */
  readonly accountName: string;
  /** The root email; unique across AWS. */
  readonly email: string;
  /** The unit's id. */
  readonly parentId: pulumi.Input<string>;
  /** Tags on the account, for policies and cost reports. */
  readonly tags?: Readonly<Record<string, string>>;
  /** An opt-in region to enable (`me-central-1`); omit for a default region. */
  readonly optInRegion?: string;
  /** The monthly budget with its alerts and the addresses they go to; omit for none. */
  readonly budget?: {
    readonly name: string;
    readonly monthlyUsd: string;
    readonly alerts: readonly BudgetAlert[];
    readonly emails: readonly string[];
  };
  /** The sign-in application, the principal granted access and the roles it may assume. */
  readonly access: {
    readonly applicationArn: string;
    readonly principal: AccessPrincipal;
    readonly roles: readonly AccessRole[];
  };
  /** The role Organizations creates in the account, which the management account assumes. */
  readonly accessRoleName?: string;
  /**
   * A read-only role a pull-request preview assumes instead, trusted by the given principals (the management
   * account's preview role), so a preview never holds the access role.
   */
  readonly reader?: {
    readonly name: string;
    readonly path: string;
    readonly trustedArns: readonly string[];
  };
  /** Reach the account through `reader` (a preview, which may not write). The first apply creates the reader. */
  readonly readOnly?: boolean;
}
