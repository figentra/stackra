/**
 * Stackra file contract:
 * Purpose: `CONDITION_SCHEMA`, the zod schema of a `Condition` from untrusted input (its `X$`): any JSON, refused with
 *          one issue per bad node unless it is a tree of `all`, `any` and `not` nodes and `{ field, operator, value }`
 *          leaves, at most 200 nodes and 8 levels deep, each field a `<source>.<field>` path and each operator a code
 *          of `Operator`.
 * Boundary: shape only, for a service that stores or forwards a tree it does not evaluate (Access): the fields and the
 *           values are checked against a registry by `Rules.conditionSchema()` or `Rules.check`. The walk is
 *           `conditionProblems`, the same one `Rules` runs, so the two never disagree on shape. Issue messages are the
 *           snake_case codes and never echo a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3 and 10); ADR 0294 (decision 26: a package ships its own `X$`); ADR 0425
 *                     (decision 4).
 */
import { z } from "zod";

import { conditionProblems } from "#core/functions/condition-problems.function";
import type { Condition } from "#core/types/condition.type";

/** The shipped `Condition$`. */
export const CONDITION_SCHEMA: z.ZodType<Condition> = z
  .json()
  .superRefine((value, ctx) => {
    for (const [path, code] of Object.entries(conditionProblems(value)))
      ctx.addIssue({
        code: "custom",
        message: code,
        path: path === "(root)" ? [] : path.split("."),
      });
  })
  .transform((value) => value as Condition) as unknown as z.ZodType<Condition>;
