/**
 * Stackra file contract:
 * Purpose: `envSecrets`, the `SecretStore` `bootApp` resolves `@Secret("NAME")` fields from: the same raw environment
 *          the runtime received, where runway's Infisical sync put the values (ADR 0173).
 * Boundary: answers by name only; it lists nothing and never prints a value. An empty string counts as unset, so a
 *           required secret left blank fails boot by name. Not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (Infisical sync into the runtimes); ADR 0294 (decision 19); ADR 0146 as amended.
 */
import { SecretStore } from "@stackra/config/contracts";

/**
 * A secret store over `env`.
 *
 * @example
 * buildConfig(ResendConfig, { env, secrets: envSecrets(env) });
 */
export function envSecrets(env: Readonly<Record<string, unknown>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get(name: string): string | undefined {
      const value = env[name];
      return typeof value === "string" && value !== "" ? value : undefined;
    },
  });
}
