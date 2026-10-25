/**
 * Stackra file contract:
 * Purpose: `crossAccount(user, condition?)`, the principal and condition of a policy statement that lets another
 *          account in: its root as the principal and, when the user lists roles, an `aws:PrincipalArn` condition that
 *          narrows it to those roles.
 * Boundary: internal; the role is a condition, never a principal, so the policy stays valid before the role exists.
 *           The other account's own IAM must still allow the call.
 * Runtime: node
 * Governing contract: ADR 0172 (account boundaries).
 */
import type { KeyUser } from "#node/types/key-user.type";

/**
 * The `Principal` and `Condition` of a statement for `user`.
 *
 * @param condition - more condition operators to keep (`{ Bool: { "kms:GrantIsForAWSResource": "true" } }`).
 */
export function crossAccount(
  user: KeyUser,
  condition: Readonly<Record<string, object>> = {},
): { Principal: { AWS: string }; Condition?: Record<string, object> } {
  const all = {
    ...condition,
    ...(user.roles === undefined ? {} : { ArnLike: { "aws:PrincipalArn": [...user.roles] } }),
  };
  return {
    Principal: { AWS: `arn:aws:iam::${user.account}:root` },
    ...(Object.keys(all).length === 0 ? {} : { Condition: all }),
  };
}
