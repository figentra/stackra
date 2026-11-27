/**
 * Stackra file contract:
 * Purpose: `emitRunwayConfig`, a service's `#stackra/runway-config` (`.stackra/gen/runway-config.ts`): runway's
 *          `config` values of every environment, by config key (the root's `defaults.service.config` with the
 *          member's own over it). The server, seed and console entries hand it to `bootApp`, which applies the running
 *          environment's (`STACKRA_ENVIRONMENT`, `dev` when unset) over the environment variables, so a runway value
 *          such as `config.actions.stores` reaches its configuration class (ADR 0296: the last layer; STA-2798).
 * Boundary: pure. Written only for a service whose runway sets a `config` value in some environment; any other member
 *           gets none and its entries pass none. Values are fixed at build time, never runtime env vars; runway holds
 *           no secret value (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); ADR 0294 (decision 19); ADR 0295 (decisions 7 and 8); ADR 0173; STA-2798.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The runway values of a service, or undefined when no environment sets one.
 *
 * @example
 * emitRunwayConfig(ir); // '...export const runwayConfig = {\n  "production": {"actions.stores":{...}},\n};...'
 */
export function emitRunwayConfig(ir: MemberIR): string | undefined {
  if (ir.layout !== "service" || ir.runwayConfig === undefined) return undefined;
  const rows = Object.entries(ir.runwayConfig)
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([environment, values]) => `  ${JSON.stringify(environment)}: ${JSON.stringify(values)},`);
  const header = generatedHeader({
    from: "the `config` of each environment of runway.yaml and the root's `defaults.service.config`",
    purpose: `runway's configuration values of ${ir.package}, per environment and config key.`,
    boundary:
      "every environment is fixed here at build time; bootApp applies the one STACKRA_ENVIRONMENT names (dev when " +
      "unset) over the environment variables. Values only, never a secret.",
    runtime: "isomorphic",
  });
  return [
    header,
    "/** Runway's `config` values: environment to config key to fields. */",
    "export const runwayConfig: Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, unknown>>>>>> = {",
    ...rows,
    "};",
    "",
  ].join("\n");
}
