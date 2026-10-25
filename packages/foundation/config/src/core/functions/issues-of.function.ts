/**
 * Stackra file contract:
 * Purpose: `issuesOf`, which turns zod's issues for a configuration into `ConfigIssue`s that name the environment
 *          variable or the secret each bad value came from.
 * Boundary: copies paths and messages only, never an issue's input; an issue on a `@Secret` field gets a fixed message
 *           naming the secret, so not even an author's refine message can echo its value. Internal: not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (consequences: the path of the bad value); ADR 0173.
 */
import type { ZodError } from "zod";

import type { ConfigIssue } from "#core/types/config-issue.type";

/**
 * The issues of `error`, with variable and secret names.
 *
 * @param error - the failed parse.
 * @param variables - field to environment variable (the class's `env` map).
 * @param secrets - field to secret name.
 * @example
 * issuesOf(result.error, { storefrontBaseUrl: "STACKRA_STOREFRONT_BASE_URL" }, Secret.members(CommerceOptions));
 */
export function issuesOf(
  error: ZodError,
  variables: Readonly<Record<string, string>>,
  secrets: ReadonlyMap<string | symbol, string>,
): ConfigIssue[] {
  return error.issues.map((issue) => {
    const field = String(issue.path[0] ?? "");
    const path = issue.path.map(String).join(".") || "(root)";
    const secret = secrets.get(field);
    if (secret !== undefined) return { path, message: `secret ${secret} is missing or invalid` };
    const variable = variables[field];
    return {
      path,
      message: variable === undefined ? issue.message : `${issue.message} (${variable})`,
    };
  });
}
