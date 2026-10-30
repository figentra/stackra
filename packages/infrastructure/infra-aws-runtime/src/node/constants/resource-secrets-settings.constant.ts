/**
 * Stackra file contract:
 * Purpose: `RESOURCE_SECRETS_SETTINGS`, where a resource's connection details are written in Infisical
 *          (`<environment>:/runtime/<resource>`), the database admin user, and the generated password's byte length.
 * Boundary: data only; names and sizes, never a value.
 * Runtime: node
 * Governing contract: ADR 0493 (decision 4), ADR 0173.
 */

/** Resource secret facts. */
export const RESOURCE_SECRETS_SETTINGS = Object.freeze({
  /** The Infisical folder under an environment, followed by the resource name. */
  folder: "/runtime",
  /** The admin user `awsDatabases` creates. */
  adminUser: "stackra_admin",
  /** Random bytes in a generated password (base64url, 43 characters). */
  passwordBytes: 32,
} as const);
