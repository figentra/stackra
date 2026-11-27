/**
 * Stackra file contract:
 * Purpose: `derivePrefix(model, taken)`, the public id prefix of a new model: its first three letters, else the first
 *          letter with two later ones, else its first four to six letters, skipping every prefix already taken. A
 *          written `--prefix` is checked instead: 2 to 6 lowercase letters and not taken.
 * Boundary: pure. `taken` is the shared registry of `@stackra/gen` (minus the model's own key) plus the prefixes the
 *           member's models already declare, so gen's `prefix_taken` and `prefix_duplicate` never fire on a scaffold.
 * Runtime: node
 * Governing contract: ADR 0135 (rule 2: one prefix per model, the shared registry); ADR 0294 (decision 20).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";

/** Gen's prefix rule (`prefix_invalid`). */
const VALID = /^[a-z]{2,6}$/;

/**
 * The prefix of a new model.
 *
 * @param model - the model's kebab-case name.
 * @param taken - the prefixes another model owns.
 * @param written - the `--prefix` value, if any.
 * @throws CliUsageError when the written prefix is invalid or taken, or no derived one is free.
 * @example
 * derivePrefix("order-line", new Set(["ord"])); // "ore"
 */
export function derivePrefix(model: string, taken: ReadonlySet<string>, written?: string): string {
  if (written !== undefined) {
    if (!VALID.test(written))
      throw new CliUsageError(`--prefix ${written} is not 2 to 6 lowercase letters`);
    if (taken.has(written))
      throw new CliUsageError(`--prefix ${written} is the public id prefix of another model`);
    return written;
  }
  const letters = model.replaceAll(/[^a-z]/g, "");
  const candidates = [letters.slice(0, 3)];
  for (let second = 1; second < letters.length; second++)
    for (let third = second + 1; third < letters.length; third++)
      candidates.push(`${letters[0]}${letters[second]}${letters[third]}`);
  candidates.push(letters.slice(0, 4), letters.slice(0, 5), letters.slice(0, 6));
  const free = candidates.find((candidate) => VALID.test(candidate) && !taken.has(candidate));
  if (free === undefined)
    throw new CliUsageError(
      `no free public id prefix derives from ${model}; pass --prefix <2 to 6 lowercase letters>`,
    );
  return free;
}
