/**
 * Stackra file contract:
 * Purpose: `deployedTarget(env, input)`, why a writing tool call might act on a deployed environment: the server
 *          runs with no `STACKRA_ENVIRONMENT` (unset is never taken as local), or with one that is not local (what
 *          runway sets in a deployed runtime), or the call's `env` or `environment` names one. Undefined only when
 *          the server says it runs in `dev` or `test` and the call names no other environment.
 * Boundary: pure; fails closed. Only names are compared (`LOCAL_ENVIRONMENTS`); no environment is contacted.
 *           `stackra mcp` and `stackra dev` set `STACKRA_ENVIRONMENT=dev` themselves when nothing is set.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local MCP writes locally; deployed writes need approval); STA-2873.
 */
import { LOCAL_ENVIRONMENTS } from "#node/constants/local-environments.constant";

/** The input keys that name an environment. */
const ENVIRONMENT_KEYS = ["env", "environment"] as const;

/**
 * The reason a writing call would reach a deployed target, or undefined.
 *
 * @param env - the server's environment.
 * @param input - the tool call's arguments.
 * @example
 * deployedTarget({ STACKRA_ENVIRONMENT: "production" }, {}); // "the server runs in production (STACKRA_ENVIRONMENT)"
 * deployedTarget({}, {}); // "the server's STACKRA_ENVIRONMENT is unset, so it may be a deployed runtime"
 */
export function deployedTarget(
  env: Readonly<Record<string, string | undefined>>,
  input: unknown,
): string | undefined {
  const own = env["STACKRA_ENVIRONMENT"];
  // Unset is not local: only a server that says it runs in dev or test may write.
  if (own === undefined || own === "")
    return "the server's STACKRA_ENVIRONMENT is unset, so it may be a deployed runtime";
  if (!LOCAL_ENVIRONMENTS.includes(own)) return `the server runs in ${own} (STACKRA_ENVIRONMENT)`;
  if (typeof input !== "object" || input === null) return undefined;
  for (const key of ENVIRONMENT_KEYS) {
    const named = (input as Record<string, unknown>)[key];
    if (typeof named === "string" && named !== "" && !LOCAL_ENVIRONMENTS.includes(named))
      return `the call names the ${named} environment (${key})`;
  }
  return undefined;
}
