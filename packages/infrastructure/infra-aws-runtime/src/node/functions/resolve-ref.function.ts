/**
 * Stackra file contract:
 * Purpose: `resolveRef(value, config?)`, a runway value read through the stack config when it is `ref:<path>`: the
 *          first segment is a stack config key holding an object (or the value itself), the rest walks into it.
 * Boundary: internal; reads the stack config only, never a secret store. A plain value passes through.
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
 * resolveRef("ref:network.staging.subnets.a"); // "subnet-0abc"
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
