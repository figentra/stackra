/**
 * Stackra file contract:
 * Purpose: the `stackra/no-enum` rule: the TypeScript `enum` keyword (and `const enum`) is refused everywhere; a
 *          value set is `Enum.of({ ... })` plus a type of the same name in `<name>.enum.ts`.
 * Boundary: syntax only; reports every enum declaration and offers no autofix (the replacement needs labels).
 * Runtime: isomorphic
 * Governing contract: ADR 0128 (decision 1, as amended by ADR 0294 decision 16); ADR 0129 (decision 1).
 */
import type { Rule } from "#core/types/rule.type";

/** Refuses `enum` declarations. */
export const NO_ENUM_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the TypeScript enum keyword (ADR 0128 decision 1, ADR 0294 decision 16).",
    },
    messages: {
      noEnum:
        "`enum {{name}}` is not used in Stackra; write `export const {{name}} = Enum.of({ ... })` and " +
        "`export type {{name}} = ...` in `<name>.enum.ts` (ADR 0128, ADR 0294 decision 16).",
    },
    schema: [],
  },
  create(context) {
    return {
      TSEnumDeclaration(node) {
        context.report({ node, messageId: "noEnum", data: { name: node.id?.name ?? "" } });
      },
    };
  },
};
