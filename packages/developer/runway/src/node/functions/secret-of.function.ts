/**
 * Stackra file contract:
 * Purpose: `secretOf(env, name)`, the value of the secret `name` from a CI job's environment (Infisical over OIDC put
 *          it there), for a store driver to put inside one request.
 * Boundary: a missing or empty secret throws naming the variable, never a value. The caller keeps the value in the
 *           request only.
 * Runtime: node
 * Governing contract: ADR 0173 (secrets by name), ADR 0480 (decision 1: the root kit), ADR 0482 (decision 9).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

/**
 * The value of `name`.
 *
 * @throws RunwayUnresolvedError when the job has no such variable.
 * @example
 * const token = secretOf(process.env, "EXPO_TOKEN");
 */
export function secretOf(env: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = env[name];
  if (value === undefined || value === "")
    throw new RunwayUnresolvedError(
      `${name} is not set in this job: it comes from Infisical in CI (runway never reads it elsewhere)`,
    );
  return value;
}
