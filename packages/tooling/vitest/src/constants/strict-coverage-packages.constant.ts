/**
 * Stackra file contract:
 * Purpose: `STRICT_COVERAGE_PACKAGES`, the packages held to `STRICT_COVERAGE_THRESHOLDS`: every package under
 *          `packages/security/` (security, tenancy, IAM and licensing among them), plus actions, outbox, workflow,
 *          versioning and validation.
 * Boundary: a frozen list of package names; a package joins it in a changeset and never leaves it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: security, tenancy, IAM, actions, outbox, workflow, versioning, validation
 *                     and licensing need 90% and 80%).
 */
/** The package names held to the strict floor. A new `packages/security/*` package joins this list. */
export const STRICT_COVERAGE_PACKAGES: readonly string[] = Object.freeze([
  "@stackra/access-log",
  "@stackra/actions",
  "@stackra/consent",
  "@stackra/csp",
  "@stackra/entitlements",
  "@stackra/iam",
  "@stackra/identity",
  "@stackra/licensing",
  "@stackra/outbox",
  "@stackra/privacy",
  "@stackra/scope",
  "@stackra/tenancy",
  "@stackra/validation",
  "@stackra/versioning",
  "@stackra/workflow",
]);
