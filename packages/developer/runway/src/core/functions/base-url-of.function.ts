/**
 * Stackra file contract:
 * Purpose: `baseUrlOf(member)`, a member's dev origin from the runway facts (its runway's `environments.dev` port and
 *          host, lane offsets applied): the generated Playwright and Lighthouse configs' base URL, so no URL is typed.
 * Boundary: reads the facts only; the port is written once, in the member runway (ADR 0296).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5: generated tool configs), ADR 0269 (e2e).
 */
import type { Url } from "@stackra/contracts";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { memberFacts } from "#core/functions/member-facts.function";

/**
 * The member's dev origin.
 *
 * @param member - the member key (`web`, `console`).
 * @throws RunwayUnresolvedError when there are no facts, the member is absent, or it has no dev origin.
 * @example
 * export default e2ePreset({ baseURL: baseUrlOf("web") }); // "http://localhost:5175" on lane 0
 */
export function baseUrlOf(member: string): Url {
  const { member: entry } = memberFacts(member);
  if (entry.url === undefined) {
    throw new RunwayUnresolvedError(
      `"${member}" has no dev origin in the runway facts: give its runway.yaml environments.dev a port`,
    );
  }
  return entry.url;
}
