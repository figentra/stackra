/**
 * Stackra file contract:
 * Purpose: `schemaOf`, which reads a shape class's generated zod schema from the registry: the lookup behind
 *          `validate`, `X.create`, a config class's layering and a form adapter.
 * Boundary: reads the registry only, matching the class exactly: a subclass is not validated with its parent's schema,
 *           because the subclass may declare fields its parent's schema would strip. A class with no schema is a
 *           build or setup mistake, so it throws instead of returning a failure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); registry v3.1 gap G1.
 */
import type { AnyClass } from "@stackra/container";
import type { ZodType } from "zod";

import { SCHEMA_REGISTRY } from "#core/constants/schema-registry.constant";

/**
 * The schema registered for `type`.
 *
 * @throws TypeError when no schema is registered for `type` itself.
 * @example
 * const form = useForm({ resolver: zodResolver(schemaOf(QuickOrderForm)) });
 */
export function schemaOf(type: AnyClass): ZodType {
  const schema = SCHEMA_REGISTRY.get(type);
  if (schema === undefined)
    throw new TypeError(
      `${type.name || "This class"} has no registered schema: run \`stackra gen\` and load its member's generated ` +
        `#stackra/schemas, or call registerSchemas([[${type.name || "Class"}, schema]]) in a test`,
    );
  return schema;
}
