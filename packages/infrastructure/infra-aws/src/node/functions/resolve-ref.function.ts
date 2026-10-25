/**
 * Stackra file contract:
 * Purpose: `resolveRef(value, config?)`, a runway value as the Pulumi program uses it: a literal stays as it is, and
 *          `ref:<path>` is read from the stack config of the private stacks repository, the first path segment being
 *          the config key and the rest a walk into its structured value (`ref:aws.accounts.prod` reads key `aws`,
 *          then `accounts.prod`).
 * Boundary: reads the stack config only; never an environment variable, a file or a secret. A `ref:` value is an id
 *           or an amount, so a missing or non-scalar one fails the program before any resource is planned.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4 as amended by 0289 decision 9: the stacks repository), ADR 0173 (no
 *                     secret value in a runway).
 */
import * as pulumi from "@pulumi/pulumi";

/** The prefix of a reference. */
const REF = "ref:";

/**
 * The value `value` stands for.
 *
 * @param config - the stack config to read; defaults to the project's (`new pulumi.Config()`).
 * @throws Error when the config key is missing (Pulumi's config error) or the path ends on no string or number.
 * @example
 * // Pulumi.production.yaml: acme-platform:aws: { accounts: { prod: "123456789012" } }
 * resolveRef("ref:aws.accounts.prod"); // "123456789012"
 * resolveRef("me-central-1"); // "me-central-1"
 */
export function resolveRef(value: string, config: pulumi.Config = new pulumi.Config()): string {
  if (!value.startsWith(REF)) return value;
  const [key = "", ...path] = value.slice(REF.length).split(".");
  if (path.length === 0) return config.require(key);
  let node: unknown = config.requireObject<unknown>(key);
  for (const segment of path)
    node =
      typeof node === "object" && node !== null
        ? (node as Record<string, unknown>)[segment]
        : undefined;
  if (typeof node !== "string" && typeof node !== "number")
    throw new Error(
      `${value} is not set: put a string or a number at "${path.join(".")}" under the stack config key "${key}"`,
    );
  return String(node);
}
