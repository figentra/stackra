/**
 * Stackra file contract:
 * Purpose: `settingSystemAuthor(name)`, the author of a settings write no person makes: a seeder, a product seed
 *          pack, a migration. It answers the system principal id `sys_<name>`, the form the workflow runner and the
 *          access log already use for a system actor, so a revision always names who made it.
 * Boundary: pure. The name is snake_case and says which job wrote (`seed`, `market_pack_seed`); a request never chooses
 *           it, because the author is never request input (ADR 0213 d5). Four-eyes still applies: a system author
 *           cannot approve its own pending revision, and a person approves it.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5: revisions name their author); ADR 0419 (decision 1).
 */

/** A system job's name: lower snake_case, starting with a letter. */
const NAME = /^[a-z][a-z0-9_]*$/;

/**
 * The author id of system job `name`.
 *
 * @throws RangeError when `name` is not lower snake_case.
 * @example
 * await packs.applyPack({ scope }, pack, { author: settingSystemAuthor("seed"), environment: SettingEnvironment.Live });
 */
export function settingSystemAuthor(name: string): string {
  if (!NAME.test(name))
    throw new RangeError(`A system settings author is lower snake_case, not "${name}"`);
  return `sys_${name}`;
}
