/**
 * Stackra file contract:
 * Purpose: `configOptionsOf`, which reads the `schema` and `env` a configuration class was declared with, from the
 *          kind registry, for the base constructor, the layering and env hydration.
 * Boundary: reads `kindOf` only; no reflect-metadata. A class that is not a called `Config(...)` throws a TypeError, so
 *           a wrong class fails on first use. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: kind options live in the kind registry); ADR 0305 (rule 34).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Schema } from "@stackra/validation";

/**
 * The declared options of a configuration class or of a subclass of one.
 *
 * @throws TypeError when `type` does not extend `Config({ schema })`.
 * @example
 * configOptionsOf(LoyaltyKitConfig); // { schema: LoyaltyKitOptions, env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" } }
 */
export function configOptionsOf(type: object): {
  readonly schema: AnyClass<Schema>;
  readonly env: Readonly<Record<string, string>>;
} {
  const record = kindOf(type);
  const schema = record?.kind === "config" ? record.options["schema"] : undefined;
  if (typeof schema !== "function")
    throw new TypeError(
      `${(type as { name?: string }).name || "This class"} is not a configuration: write class X extends Config({ schema })`,
    );
  return {
    schema: schema as AnyClass<Schema>,
    env: (record?.options["env"] ?? {}) as Readonly<Record<string, string>>,
  };
}
