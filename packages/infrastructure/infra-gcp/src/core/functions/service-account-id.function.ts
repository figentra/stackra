/**
 * Stackra file contract:
 * Purpose: `serviceAccountId(deployment, purpose)`, the fixed id of one of a deployment's service accounts
 *          (`acme-staging-infra`, `acme-staging-stop`), so its email is known before it exists and the deploy job's
 *          config can name it; the guard on GCP's 30-character limit.
 * Boundary: pure; `gcpDeploymentOf` calls it for every purpose while reading the runway, so a project name that is too
 *           long fails `stackra validate`, not a Pulumi run. GCP takes 6 to 30 lower-case letters, digits and hyphens,
 *           starting with a letter, which the runway project, environment and dedicated keys already are, so only the
 *           length can fail.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 1: environments separated by roles), ADR 0354 (decision 3), ADR 0231 (names),
 *                     ADR 0401 (the length guard).
 */

/** The longest service account id GCP accepts. */
const LIMIT = 30;

/**
 * The service account's id.
 *
 * @param deployment - `<project>-<environment>`, or `<project>-<dedicated key>`.
 * @param purpose - what the account does (`infra`, `stop`).
 * @throws TypeError when the id is not one GCP accepts (longer than 30 characters).
 * @example
 * serviceAccountId("acme-staging", "infra"); // "acme-staging-infra"
 */
export function serviceAccountId(deployment: string, purpose: string): string {
  const id = `${deployment}-${purpose}`;
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(id))
    throw new TypeError(
      `${id} is not a GCP service account id (6 to ${LIMIT} characters): shorten the project or the key by ${Math.max(0, id.length - LIMIT)}`,
    );
  return id;
}
