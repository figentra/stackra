/**
 * Stackra file contract:
 * Purpose: `runwayFacts()`, the facts the readers answer from: the `__STACKRA_RUNWAY__` document a bundle was built
 *          with (`define: definesFor(member, environment)`), else the dev facts file `stackra dev` wrote.
 * Boundary: internal. The injected document wins, so a packaged Electron app never looks for a file. Nothing is
 *           cached: a lane switch rewrites the dev file, and every read sees it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5), ADR 0254 (the feed in a packaged build).
 */
import { DEV_FACTS_PATH } from "#core/constants/dev-facts-path.constant";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { parseRunwayFacts } from "#core/functions/parse-runway-facts.function";
import { readDevFacts } from "#core/functions/read-dev-facts.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";

/** Replaced by the bundler's `define` with the facts `definesFor` resolved; undeclared everywhere else. */
// oxlint-disable-next-line no-underscore-dangle -- a bundler define identifier, dunder by convention
declare const __STACKRA_RUNWAY__: unknown;

/**
 * The resolved runway facts.
 *
 * @throws RunwayUnresolvedError when the bundle carries no facts and no dev facts file exists.
 * @throws RunwayInvalidError when the facts break their schema.
 * @example
 * runwayFacts().members.web?.url; // "http://localhost:5175"
 */
export function runwayFacts(): RunwayFacts {
  if (typeof __STACKRA_RUNWAY__ !== "undefined") {
    return parseRunwayFacts(__STACKRA_RUNWAY__, "the injected __STACKRA_RUNWAY__");
  }
  const facts = readDevFacts();
  if (facts === undefined) {
    throw new RunwayUnresolvedError(
      `No runway facts: run \`stackra dev\` (it writes ${DEV_FACTS_PATH}), or build this bundle with ` +
        "`define: definesFor(member, environment)` from @stackra/runway/node",
    );
  }
  return facts;
}
