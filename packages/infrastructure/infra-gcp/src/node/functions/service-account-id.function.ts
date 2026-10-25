/**
 * Stackra file contract:
 * Purpose: `serviceAccountId(project, environment)`, the fixed id of the environment's infra service account
 *          (`acme-staging-infra`), so its email is known before it exists and the deploy job's config can name it.
 * Boundary: internal; GCP takes 6 to 30 lower-case letters, digits and hyphens, starting with a letter, which the runway
 *           project and environment names already are, so only the length can fail.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: environments separated by roles), ADR 0354 (decision 3), ADR 0231 (names).
 */

/**
 * The service account's id.
 *
 * @throws TypeError when the id is not one GCP accepts (longer than 30 characters).
 */
export function serviceAccountId(project: string, environment: string): string {
  const id = `${project}-${environment}-infra`;
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(id))
    throw new TypeError(`${id} is not a GCP service account id (6 to 30 characters)`);
  return id;
}
