/**
 * Stackra file contract:
 * Purpose: `roleName(project, environment, purpose)`, the fixed name of a role one stack creates and another stack
 *          trusts by ARN (`acme-platform-staging-infra`), so the state, backup and environment stacks agree without
 *          reading each other's outputs.
 * Boundary: internal; a fixed name makes the ARN known before the role exists, which a key or bucket policy needs
 *           (it names the role in an `aws:PrincipalArn` condition, never as a principal).
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: environments separated by IAM roles), ADR 0231 (names).
 */

/**
 * The role's name.
 *
 * @throws TypeError when the name is longer than IAM's 64 characters.
 */
export function roleName(
  project: string,
  environment: string,
  purpose: "infra" | "replication" | "backup" | "encore" | "budget-action",
): string {
  const name = `${project}-${environment}-${purpose}`;
  if (name.length > 64) throw new TypeError(`${name} is longer than an IAM role name may be (64)`);
  return name;
}
