/**
 * Stackra file contract:
 * Purpose: `resolveRef(value, path?)`, a runway value as the program uses it: a `ref:<key>.<path>` value is read from
 *          the stack config of the private stacks repository, in the project's namespace, the first segment being the
 *          config key and the rest a walk into its structured value (`ref:cloudflare.zones.acme` is `pulumi config set
 *          --path cloudflare.zones.acme <id>`), the convention @stackra/infra-aws reads too; any other value is
 *          returned as a string.
 * Boundary: reads Pulumi config only, at program time, never a file or the environment. Ids and names only: a secret
 *           never goes through a `ref:` (ADR 0173), so the value is read as plain config. The project namespace is
 *           not a provider's, so `cloudflare.*` never collides with the Cloudflare provider's own `cloudflare:*` keys.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0171 (decision 4, amended by ADR 0289 decision 9: stacks in `figentra/infra`), ADR 0296
 *                     (root runway `ref:` values), ADR 0173.
 */
import * as pulumi from "@pulumi/pulumi";

import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";

/**
 * The plain value of `value`.
 *
 * @param value - a runway value: a literal, or `ref:<key>[.<path>]`.
 * @param path - where the value sits in the runway, for the error.
 * @throws CloudflareConfigInvalidError when a `ref:` names nothing in the stack config, or a non-scalar.
 * @example
 * // Pulumi.core.yaml: figentra-infra:cloudflare: { accountId: "023e…", zones: { acme: "1a2b…" } }
 * resolveRef("ref:cloudflare.accountId", "providers.cloudflare.accountId"); // "023e…"
 * resolveRef("figentra"); // "figentra"
 */
export function resolveRef(value: string | number | boolean, path = "value"): string {
  if (typeof value !== "string" || !value.startsWith("ref:")) return String(value);
  const [key = "", ...rest] = value.slice("ref:".length).split(".");
  const config = new pulumi.Config();
  let found: unknown = rest.length === 0 ? config.get(key) : config.getObject<unknown>(key);
  for (const segment of rest)
    found =
      typeof found === "object" && found !== null
        ? (found as Record<string, unknown>)[segment]
        : undefined;
  if (typeof found !== "string" && typeof found !== "number")
    throw new CloudflareConfigInvalidError("Pulumi stack config", [
      {
        path,
        message: `${value} is not set: \`pulumi config set --path ${value.slice("ref:".length)} <value>\``,
      },
    ]);
  return String(found);
}
