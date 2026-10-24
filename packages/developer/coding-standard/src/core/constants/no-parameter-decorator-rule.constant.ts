/**
 * Stackra file contract:
 * Purpose: the `stackra/no-parameter-decorator` rule: a constructor or method parameter carries no decorator,
 *          because a dependency is named by its parameter type (classes are the only tokens).
 * Boundary: a decorator is allowed only on a class, a class field, a method or an accessor; anything else (a plain
 *           parameter, a parameter property, a defaulted parameter) is reported.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R6, parameter decorators are banned; decision 17, classes are the only tokens).
 */
import type { Rule } from "#core/types/rule.type";

const DECORATABLE = new Set([
  "ClassDeclaration",
  "ClassExpression",
  "PropertyDefinition",
  "MethodDefinition",
  "AccessorProperty",
  "TSAbstractPropertyDefinition",
  "TSAbstractMethodDefinition",
  "TSAbstractAccessorProperty",
]);

/** Refuses decorators on parameters. */
export const NO_PARAMETER_DECORATOR_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow parameter decorators; the parameter type names the dependency (ADR 0294 R6).",
    },
    messages: {
      parameterDecorator:
        "A parameter takes no decorator: the container resolves it by its type (ADR 0294 R6 and decision 17).",
    },
    schema: [],
  },
  create(context) {
    return {
      Decorator(node) {
        if (DECORATABLE.has(node.parent?.type ?? "")) return;
        context.report({ node, messageId: "parameterDecorator" });
      },
    };
  },
};
