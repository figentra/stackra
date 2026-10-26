/**
 * Stackra file contract:
 * Purpose: `parseCheckOptions(values, defaults)`, the `CheckOptions` of one `stackra check` run from its parsed flags and
 *          an alias's defaults: `--only`/`--skip` checked against the phase names, `--format` against text, json and
 *          github, and `test` kept only when `--with-tests` or `--only` asks for it.
 * Boundary: pure; a bad flag value throws `CliUsageError` (exit 2).
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import { CHECK_PHASES } from "#node/constants/check-phases.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CheckOptions } from "#node/types/check-options.type";

/** The phases a comma-separated flag names, each checked against the known phases. */
function phaseList(flag: string, value: string): string[] {
  const known = CHECK_PHASES.map((phase) => phase.name);
  const names = value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const name of names)
    if (!known.includes(name))
      throw new CliUsageError(`--${flag}: unknown phase ${name} (expected ${known.join(", ")})`);
  return names;
}

/**
 * The options of one run.
 *
 * @param values - the parsed flags (`fix`, `affected`, `only`, `skip`, `format`, `base`, `with-tests`, `keep-going`).
 * @param defaults - what an alias presets (`only`, `fix`, `withTests`); a flag on the command line wins.
 * @throws CliUsageError when a phase or format is unknown.
 * @example
 * parseCheckOptions({ only: "format,lint", fix: true }, {}).phases; // ["format", "lint"]
 */
export function parseCheckOptions(
  values: Readonly<Record<string, string | boolean | undefined>>,
  defaults: {
    readonly only?: readonly string[] | undefined;
    readonly fix?: boolean | undefined;
    readonly withTests?: boolean | undefined;
  },
): CheckOptions {
  const only =
    typeof values["only"] === "string" ? phaseList("only", values["only"]) : defaults.only;
  const skip = typeof values["skip"] === "string" ? phaseList("skip", values["skip"]) : [];
  const withTests = values["with-tests"] === true || defaults.withTests === true;
  const format = values["format"] ?? "text";
  if (format !== "text" && format !== "json" && format !== "github")
    throw new CliUsageError(
      `--format: unknown format ${String(format)} (expected text, json or github)`,
    );
  const base = typeof values["base"] === "string" ? values["base"] : undefined;
  const phases = CHECK_PHASES.map((phase) => phase.name).filter(
    (name) =>
      (only === undefined
        ? name !== "test" || withTests
        : only.includes(name) || (name === "test" && withTests)) && !skip.includes(name),
  );
  return {
    fix: values["fix"] === true || defaults.fix === true,
    affected: values["affected"] === true,
    base,
    phases,
    keepGoing: values["keep-going"] === true,
    format,
    withTests,
  };
}
