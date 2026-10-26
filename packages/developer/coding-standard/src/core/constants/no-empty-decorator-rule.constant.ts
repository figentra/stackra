/**
 * Stackra file contract:
 * Purpose: the `stackra/no-empty-decorator` rule: a decorator is never called with nothing (`@Trim()`) or an empty
 *          object (`@Setting({})`); it is written bare (`@Trim`), as the template writes `@Int` and `@Trim`, or
 *          dropped when the folder, suffix, base class or type already says it.
 * Boundary: a bare decorator (`@Searchable`) passes. No autofix: whether to write it bare or drop it depends on the
 *           decorator, and dropping a facet such as `@Auditable()` silently would lose behaviour.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R6, empty decorators are banned; the decorator test).
 */
import { rootIdentifier } from "../functions/root-identifier.function.ts";
import type { Rule } from "#core/types/rule.type";

/** Refuses decorators called with no arguments or an empty object. */
export const NO_EMPTY_DECORATOR_RULE: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow decorators called with no arguments or an empty object (ADR 0294 R6).",
    },
    messages: {
      emptyDecorator:
        "`@{{name}}` is called with no options; write it bare (`@{{name}}`) or drop it when the folder, suffix, " +
        "base class or type already says it (ADR 0294 R6, the decorator test).",
    },
    schema: [],
  },
  create(context) {
    return {
      Decorator(node) {
        const call = node.expression;
        if (call?.type !== "CallExpression") return;
        const args = call.arguments ?? [];
        const [first] = args;
        const isEmpty =
          args.length === 0 ||
          (args.length === 1 &&
            first?.type === "ObjectExpression" &&
            (first.properties ?? []).length === 0);
        if (!isEmpty) return;
        context.report({
          node,
          messageId: "emptyDecorator",
          data: { name: rootIdentifier(call) ?? "" },
        });
      },
    };
  },
};
