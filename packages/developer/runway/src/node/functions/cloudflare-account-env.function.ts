/**
 * Stackra file contract:
 * Purpose: `cloudflareAccountEnv(accountId, env)`, the variables wrangler runs with for runway's
 *          `providers.cloudflare.accountId`: a literal id sets `CLOUDFLARE_ACCOUNT_ID`; a `ref:` id leaves the job's own
 *          `CLOUDFLARE_ACCOUNT_ID` in place, and refuses when the job has none.
 * Boundary: reads one variable's presence from `env`, never prints a value. Decides only; the caller passes the result
 *           to wrangler (`publishProduct`, the CLI's edge KV writer).
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1, `ref:` values resolve in the deploy job); STA-2124.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

/** The variable wrangler reads the Cloudflare account from. */
const VARIABLE = "CLOUDFLARE_ACCOUNT_ID";

/**
 * The override wrangler runs with for the runway's Cloudflare account, or `undefined` for none.
 *
 * @param accountId - `providers.cloudflare.accountId` as the runway declares it.
 * @param env - the job's environment (default `process.env`); only `CLOUDFLARE_ACCOUNT_ID`'s presence is read.
 * @returns `{ CLOUDFLARE_ACCOUNT_ID: id }` for a literal id; `undefined` with no id, or a `ref:` the job resolves.
 * @throws RunwayUnresolvedError when the id is a `ref:` and the job has no `CLOUDFLARE_ACCOUNT_ID`.
 * @example
 * cloudflareAccountEnv("d861f9ac"); // { CLOUDFLARE_ACCOUNT_ID: "d861f9ac" }
 * cloudflareAccountEnv("ref:cloudflare.accountId", { CLOUDFLARE_ACCOUNT_ID: "d861f9ac" }); // undefined
 */
export function cloudflareAccountEnv(
  accountId: string | number | boolean | undefined,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<Record<string, string>> | undefined {
  if (accountId === undefined) return undefined;
  const id = String(accountId);
  if (!id.startsWith("ref:")) return { [VARIABLE]: id };
  if ((env[VARIABLE] ?? "") === "")
    throw new RunwayUnresolvedError(
      `providers.cloudflare.accountId is ${id}, which the deploy job resolves, but ${VARIABLE} is not set: set it in the job's env`,
    );
  return undefined;
}
