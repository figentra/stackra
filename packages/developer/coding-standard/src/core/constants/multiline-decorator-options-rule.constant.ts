/**
 * Stackra file contract:
 * Purpose: the `stackra/multiline-decorator-options` rule: an object literal with two or more properties passed to a
 *          decorator or to a kind base factory (`extends Action({ ... })`) is written one property per line, with
 *          an autofix that expands it.
 * Boundary: checks the direct object arguments only, not objects nested inside them. The autofix is skipped when
 *           the object holds a comment, so no comment is ever dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R9, one property per line for decorator and base-factory options).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { RuleContext } from "#core/types/rule-context.type";
import type { RuleFix } from "#core/types/rule-fix.type";
import type { RuleFixer } from "#core/types/rule-fixer.type";
import type { Rule } from "#core/types/rule.type";

/** Whether the object's properties already sit one per line, each off the brace lines. */
const isOnePerLine = (object: AstNode, properties: readonly AstNode[]): boolean => {
  let line = object.loc.start.line;
  for (const property of properties) {
    if (property.loc.start.line <= line) return false;
    line = property.loc.end.line;
  }
  return object.loc.end.line > line;
};

/** Reports each option object of `call` that packs two or more properties onto shared lines. */
const checkCall = (context: RuleContext, call: AstNode | null | undefined): void => {
  if (call?.type !== "CallExpression") return;
  const { sourceCode } = context;
  for (const argument of call.arguments ?? []) {
    const properties = argument.properties ?? [];
    if (argument.type !== "ObjectExpression" || properties.length < 2) continue;
    if (isOnePerLine(argument, properties)) continue;
    const hasComment = sourceCode
      .getAllComments()
      .some(
        (comment) => comment.range[0] > argument.range[0] && comment.range[1] < argument.range[1],
      );
    const indent = /^\s*/.exec(sourceCode.lines[argument.loc.start.line - 1] ?? "")?.[0] ?? "";
    const body = properties
      .map(
        (property) => `${indent}  ${sourceCode.text.slice(property.range[0], property.range[1])},`,
      )
      .join("\n");
    const fix = (fixer: RuleFixer): RuleFix =>
      fixer.replaceTextRange(argument.range, `{\n${body}\n${indent}}`);
    context.report(
      hasComment
        ? { node: argument, messageId: "onePerLine" }
        : { node: argument, messageId: "onePerLine", fix },
    );
  }
};

/** Requires decorator and base-factory option objects to put one property per line. */
export const MULTILINE_DECORATOR_OPTIONS_RULE: Rule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require one property per line in decorator and base-factory option objects (ADR 0294 R9).",
    },
    fixable: "code",
    messages: {
      onePerLine:
        "An options object with two or more properties is written one property per line (ADR 0294 R9).",
    },
    schema: [],
  },
  create(context) {
    return {
      Decorator(node) {
        checkCall(context, node.expression);
      },
      ClassDeclaration(node) {
        checkCall(context, node.superClass);
      },
      ClassExpression(node) {
        checkCall(context, node.superClass);
      },
    };
  },
};
