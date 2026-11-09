/**
 * Stackra file contract:
 * Purpose: `regionLock(args)`, the SCP document that denies every regional action outside the given regions, except
 *          for the global services (`GLOBAL_ACTIONS`) and the exempt principals (break-glass and admin roles).
 * Boundary: builds the JSON object only; the organization stack creates and attaches the policy. An SCP never binds
 *           the management account.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 2: regions per account), ADR 0524 (the organization's SCPs).
 */
import { GLOBAL_ACTIONS } from "#core/constants/global-actions.constant";

/**
 * The region lock.
 *
 * @param args.sid - the statement id, e.g. `OnlyMeCentral1`.
 * @param args.regions - the regions left open.
 * @param args.exempt - principal ARN patterns the lock skips (`arn:aws:iam::*:role/OrganizationAccountAccessRole`).
 * @throws TypeError when no region is given.
 * @example
 * regionLock({ sid: "OnlyMeCentral1", regions: ["me-central-1"], exempt: [] });
 */
export function regionLock(args: {
  sid: string;
  regions: readonly string[];
  exempt: readonly string[];
}): object {
  if (args.regions.length === 0) throw new TypeError("a region lock needs at least one region");
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: args.sid,
        Effect: "Deny",
        NotAction: [...GLOBAL_ACTIONS],
        Resource: "*",
        Condition: {
          StringNotEquals: { "aws:RequestedRegion": [...args.regions] },
          ...(args.exempt.length > 0 && { ArnNotLike: { "aws:PrincipalArn": [...args.exempt] } }),
        },
      },
    ],
  };
}
