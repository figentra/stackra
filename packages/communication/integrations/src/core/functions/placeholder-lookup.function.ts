/**
 * Stackra file contract:
 * Purpose: `placeholderLookup`, the lookup a managed client resolves its placeholders with: a field of the connection
 *          first, then a `@Secret` field of the Integration (read blind from the secret store by its name), then a
 *          plain field of the Integration. A tenant's own key or OAuth app therefore wins over the platform default.
 * Boundary: internal. Only non-empty strings count, so a connection field left empty falls back to the Integration.
 *           The values are read at call time and never cached, so a rotated secret takes effect on the next call.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 3, 4 and 11); ADR 0173 (nobody reads a value).
 */
import { Secret } from "@stackra/config";
import type { SecretStore } from "@stackra/config/contracts";
import type { AnyClass } from "@stackra/container";

import type { Connection } from "#core/bases/connection.base";
import type { Integration } from "#core/bases/integration.base";

/** A string worth sending: not empty. */
const textOf = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/**
 * The lookup for one credential set.
 *
 * @example
 * resolvePlaceholders("Bearer {apiKey}", placeholderLookup(resend, connection, secrets));
 */
export function placeholderLookup(
  integration: Integration,
  connection: Connection | undefined,
  secrets: SecretStore,
): (name: string) => string | undefined {
  const secretNames = Secret.members(integration.constructor as AnyClass);
  return (name) => {
    const own = connection === undefined ? undefined : textOf(Reflect.get(connection, name));
    if (own !== undefined) return own;
    const secretName = secretNames.get(name);
    if (secretName !== undefined) return textOf(secrets.get(secretName));
    return textOf(Reflect.get(integration, name));
  };
}
