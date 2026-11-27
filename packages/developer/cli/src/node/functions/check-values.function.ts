/**
 * Stackra file contract:
 * Purpose: `checkValues(flags)`, the shared check flags by the option names the check body reads (`with-tests`,
 *          `keep-going`), for `runBody`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 7); STA-2883; STA-2924.
 */
import type { CheckOptionSet } from "#node/option-sets/check.option-set";

/**
 * The body values of `flags`.
 *
 * @example
 * runBody(io, BODY, { values: checkValues(this.flags) });
 */
export function checkValues(
  flags: CheckOptionSet,
): Readonly<Record<string, string | boolean | undefined>> {
  return {
    fix: flags.fix,
    affected: flags.affected,
    only: flags.only,
    skip: flags.skip,
    format: flags.format,
    base: flags.base,
    "with-tests": flags.withTests,
    "keep-going": flags.keepGoing,
  };
}
