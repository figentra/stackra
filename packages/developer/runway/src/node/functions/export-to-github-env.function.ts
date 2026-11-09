/**
 * Stackra file contract:
 * Purpose: `exportToGithubEnv(values, { envFile, mask })`, hands decrypted values to the next steps of a GitHub Actions
 *          job: each value is masked first (`::add-mask::`, one per line, so a multi-line key is masked whole), then
 *          appended to the job's `GITHUB_ENV` file as `NAME<<delimiter` blocks with a random delimiter.
 * Boundary: the only writer of a value outside memory, and only into the runner's own environment file, which GitHub
 *           deletes with the job. The mask lines are runner commands the log never shows. Refuses a value that holds
 *           the delimiter or a name that is not SCREAMING_SNAKE.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0257 (nobody reads a value).
 */
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

/** A secret name: SCREAMING_SNAKE. */
const NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/**
 * Masks and exports `values`; answers the names exported, sorted.
 *
 * @example
 * exportToGithubEnv(values, { envFile: process.env.GITHUB_ENV });
 * // ["STACKRA_REGISTRY_TOKEN"]
 * @throws RunwayUnresolvedError without an environment file, for a bad name, or a value holding the delimiter.
 */
export function exportToGithubEnv(
  values: ReadonlyMap<string, string>,
  options: {
    readonly envFile: string | undefined;
    readonly mask?: ((line: string) => void) | undefined;
    readonly append?: ((file: string, text: string) => void) | undefined;
  },
): string[] {
  const { envFile } = options;
  if (envFile === undefined || envFile === "")
    throw new RunwayUnresolvedError(
      "no GITHUB_ENV: secrets decrypt only writes into a GitHub Actions job's environment, never to output",
    );
  const mask = options.mask ?? ((line: string) => process.stdout.write(`::add-mask::${line}\n`));
  const append = options.append ?? ((file: string, text: string) => appendFileSync(file, text));
  const names = [...values.keys()].toSorted();
  for (const name of names) {
    if (!NAME.test(name)) throw new RunwayUnresolvedError(`not SCREAMING_SNAKE: ${name}`);
    const value = values.get(name) ?? "";
    for (const line of value.split(/\r?\n/)) if (line.trim() !== "") mask(line);
    const delimiter = `runway_${randomUUID().replaceAll("-", "")}`;
    if (value.includes(delimiter))
      throw new RunwayUnresolvedError(`${name}: the value holds the export delimiter`);
    append(envFile, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
  }
  return names;
}
