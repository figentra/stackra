/**
 * Stackra file contract:
 * Purpose: the `stackra/no-literal-shadow` rule: elevation comes from the theme's shadow tokens (`shadow-surface`,
 *          `shadow-overlay`, `shadow-field`, `shadow-(--raised-shadow)`), never from Tailwind's `shadow-sm` … `shadow-2xl`
 *          (inlined at build time, so no theme reaches them), a `shadow-[<literal>]` or a numeric native shadow
 *          (`shadowRadius`, `shadowOpacity`, `elevation`).
 * Boundary: syntax only; reads string literals, template text and object properties. `shadow-none`, a token
 *           (`shadow-surface`, `shadow-overlay`, `shadow-field`), a variable (`shadow-(--x)`, `shadow-[var(--x)]`) and a
 *           shadow colour (`shadow-black/10`) pass. A bare `shadow` counts only in a `className`. No autofix.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, lint rules); ADR 0129 (house rules as an oxlint jsPlugin).
 */
import { stringVisitors } from "../functions/string-visitors.function.ts";
import { numericStyleProperty } from "../functions/numeric-style-property.function.ts";
import { isClassNameValue } from "../functions/is-class-name-value.function.ts";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** A `shadow` utility with a size step or an arbitrary value, with any variant prefixes and the `!` modifier. */
const LITERAL =
  /(?:^|\s)(?:(?:[\w-]|\[[^\]]*\])+:)*!?(shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)|shadow-\[(?![^\]]*var\(--)[^\]]+\])(?=[\s"'`]|$)/;

/** A bare `shadow` utility. */
const BARE = /(?:^|\s)(?:(?:[\w-]|\[[^\]]*\])+:)*!?(shadow)(?=\s|$)/;

/** A native style key that draws a shadow from a number. */
const SHADOW_KEY = /^(shadowRadius|shadowOpacity|elevation)$/;

/** Refuses literal shadows. */
export const NO_LITERAL_SHADOW_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind shadow-size classes, arbitrary shadow literals and numeric native shadows; elevation comes from the theme's shadow tokens (ADR 0501).",
    },
    messages: {
      shadowClass:
        "`{{token}}` hard-codes a shadow; use `shadow-surface`, `shadow-overlay`, `shadow-field` or " +
        "`shadow-(--raised-shadow)` so the theme sets it (ADR 0501).",
      numericShadow:
        "`{{key}}: {{value}}` hard-codes a shadow; read the theme's shadow token instead (ADR 0501).",
    },
    schema: [],
  },
  create(context) {
    const check = (node: AstNode, text: string): void => {
      const inClassName = isClassNameValue(node);
      const token = LITERAL.exec(text)?.[1] ?? (inClassName ? BARE.exec(text)?.[1] : undefined);
      if (token !== undefined) context.report({ node, messageId: "shadowClass", data: { token } });
    };
    return {
      ...stringVisitors(check),
      Property(node) {
        const hit = numericStyleProperty(node, (key) => SHADOW_KEY.test(key));
        if (hit !== undefined)
          context.report({
            node,
            messageId: "numericShadow",
            data: { key: hit.key, value: String(hit.value) },
          });
      },
    };
  },
};
