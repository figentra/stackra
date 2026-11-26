/**
 * Stackra file contract:
 * Purpose: `deployedTarget(env, input)`, why a writing tool call would act on a deployed environment: the server
 *          runs with a `STACKRA_ENVIRONMENT` that is not local (what runway sets in a deployed runtime), or the call's
 *          `env` or `environment` names one. Undefined when the call stays local.
 * Boundary: pure. Only names are compared (`LOCAL_ENVIRONMENTS`); no environment is contacted.
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
 */
export function deployedTarget(
  env: Readonly<Record<string, string | undefined>>,
  input: unknown,
): string | undefined {
  const own = env["STACKRA_ENVIRONMENT"];
  if (own !== undefined && own !== "" && !LOCAL_ENVIRONMENTS.includes(own))
    return `the server runs in ${own} (STACKRA_ENVIRONMENT)`;
  if (typeof input !== "object" || input === null) return undefined;
  for (const key of ENVIRONMENT_KEYS) {
    const named = (input as Record<string, unknown>)[key];
    if (typeof named === "string" && named !== "" && !LOCAL_ENVIRONMENTS.includes(named))
      return `the call names the ${named} environment (${key})`;
  }
  return undefined;
}
