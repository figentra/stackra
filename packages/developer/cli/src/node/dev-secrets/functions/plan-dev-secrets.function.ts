/**
 * Stackra file contract:
 * Purpose: `planDevSecrets(input)`, the next content of a workspace's dev-secrets file: without `rotate`, the existing
 *          values stay and only the missing generated names are filled, and an init with nothing missing is refused;
 *          with `rotate`, every generated name gets a new value and the names set by hand stay. A name `from` holds is
 *          copied instead of generated, so two repositories can share one value.
 * Boundary: pure; the random source is a parameter. Values go only into `values`, never into the name lists.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import type { DevSecretsPlan } from "#node/dev-secrets/types/dev-secrets-plan.type";
import type { PlanDevSecretsInput } from "#node/dev-secrets/types/plan-dev-secrets-input.type";

/**
 * Plans one `stackra dev secrets init`.
 *
 * @example
 * planDevSecrets({ generate: ["SESSION_SECRET"], random: () => "x" });
 * // { refused: false, values: { SESSION_SECRET: "x" }, generated: ["SESSION_SECRET"], copied: [] }
 */
export function planDevSecrets(input: PlanDevSecretsInput): DevSecretsPlan {
  const existing = input.existing ?? {};
  const rotate = input.rotate === true;
  const missing = input.generate.filter((name) => !Object.hasOwn(existing, name));
  if (input.existing !== undefined && !rotate && missing.length === 0) return { refused: true };
  const values: Record<string, string> = { ...existing };
  const generated: string[] = [];
  const copied: string[] = [];
  for (const name of rotate ? input.generate : missing) {
    const shared = input.from?.[name];
    if (shared !== undefined) {
      values[name] = shared;
      copied.push(name);
    } else {
      values[name] = input.random();
      generated.push(name);
    }
  }
  return { refused: false, values, generated, copied };
}
