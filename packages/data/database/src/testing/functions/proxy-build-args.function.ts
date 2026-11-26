/**
 * Stackra file contract:
 * Purpose: `proxyBuildArgs`, the proxy variables a Docker build's RUN steps need, from the process environment: a
 *          build gets none of the caller's environment, so on a box whose only way out is a proxy (the testbed's
 *          jobs, STA-2572) `apt-get` in a build reaches nothing without them. Both spellings, since apt reads the
 *          lower-case ones and other tools the upper-case.
 * Boundary: pure; an unset or empty variable is left out, so a machine with no proxy builds as before.
 * Runtime: node
 * Governing contract: ADR 0182 (the integration tier); STA-2572.
 */

/** The proxy variables, upper-case; each is read in either spelling. */
const PROXY_VARIABLES = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"] as const;

/** The build arguments for the proxy variables set in `environment`, in both spellings. */
export function proxyBuildArgs(
  environment: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
  const args: Record<string, string> = {};
  for (const name of PROXY_VARIABLES) {
    const value = environment[name] || environment[name.toLowerCase()];
    if (!value) continue;
    args[name] = value;
    args[name.toLowerCase()] = value;
  }
  return args;
}
