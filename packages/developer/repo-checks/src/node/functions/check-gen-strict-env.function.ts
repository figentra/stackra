/**
 * Stackra file contract:
 * Purpose: `checkGenStrictEnv(turboJsonc)`, the `gen-strict-env` rule: every root turbo task that runs gen (`gen`,
 *          `gen:workspace`, `//#gen:workspace`) lists `STACKRA_GEN_STRICT` in its `env`. Under turbo's strict env mode
 *          (the default) an unlisted variable never reaches the task, so `STACKRA_GEN_STRICT=1 turbo run gen` ran
 *          lenient and reported none of the staged findings; `env` (not a pass-through) also puts the variable in the
 *          cache key, so a strict run never replays a lenient run's cached output.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: the staged gen checks (STAGED_REFUSAL_CODES, strict from 0.22); ADR 0295 (decision 5).
 */
import { stripJsonc } from "#node/functions/strip-jsonc.function";

/** The variable that turns the staged gen checks into refusals. */
const STRICT = "STACKRA_GEN_STRICT";

/** The root turbo tasks that run gen. */
const GEN_TASKS: ReadonlySet<string> = new Set(["gen", "gen:workspace", "//#gen:workspace"]);

/** The part of turbo.jsonc this rule reads. */
interface TurboConfig {
  /** `loose` passes every variable through; strict (the default) passes only the declared ones. */
  readonly envMode?: string;

  /** The root tasks by name. */
  readonly tasks?: Readonly<Record<string, { readonly env?: readonly string[] }>>;
}

/**
 * The findings for gen tasks whose `env` does not carry `STACKRA_GEN_STRICT`.
 *
 * @param turboJsonc - the root `turbo.jsonc`'s text; undefined when the file is missing.
 * @example
 * checkGenStrictEnv('{ "tasks": { "gen": {} } }'); // ['turbo.jsonc: task "gen" runs gen but …']
 */
export function checkGenStrictEnv(turboJsonc?: string): string[] {
  if (turboJsonc === undefined) return [];
  const config = JSON.parse(stripJsonc(turboJsonc)) as TurboConfig;
  if (config.envMode === "loose") return [];
  return Object.entries(config.tasks ?? {})
    .filter(([name, task]) => GEN_TASKS.has(name) && !(task.env ?? []).includes(STRICT))
    .map(
      ([name]) =>
        `turbo.jsonc: task "${name}" runs gen but its env does not list ${STRICT}; turbo drops the variable, so ` +
        `\`${STRICT}=1 turbo run gen\` runs lenient and hides the staged findings (add it to the task's env)`,
    );
}
