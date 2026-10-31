/**
 * Stackra file contract:
 * Purpose: the `stackra/no-literal-length` rule: sizes come from the theme (Tailwind's scale steps, which read
 *          `--spacing`, the type scale, or a `--size-*`, `--text-*` variable), never from an arbitrary `[13px]` or
 *          `[0.625rem]` utility, nor a numeric `fontSize`, `lineHeight`, `letterSpacing` or `borderWidth` in a style.
 * Boundary: syntax only; reads string literals, template text and object properties. `em` and `%` (relative to the
 *           element) pass, as do variables (`w-(--size-panel)`, `text-(length:--text-3xs)`). No autofix.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, lint rules); ADR 0129 (house rules as an oxlint jsPlugin).
 */
import { reportFirstMatch } from "../functions/report-first-match.function.ts";
import { stringVisitors } from "../functions/string-visitors.function.ts";
import { numericStyleProperty } from "../functions/numeric-style-property.function.ts";
import type { Rule } from "#core/types/rule.type";

/** A utility with an arbitrary px or rem length, with variant prefixes and the `!` modifier. */
const LITERAL =
  /(?:^|\s)(?:(?:[\w-]|\[[^\]]*\])+:)*!?(-?[a-z][\w-]*-\[-?\d*\.?\d+(?:px|rem)\])(?=[\s"'`]|$)/;

/** A style key whose number is a type or edge size. */
const LENGTH_KEY = /^(fontSize|lineHeight|letterSpacing|borderWidth)$/;

/** Refuses literal lengths. */
export const NO_LITERAL_LENGTH_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow arbitrary px and rem utilities and numeric type and edge sizes; sizes come from the theme (ADR 0501).",
    },
    messages: {
      lengthClass:
        "`{{token}}` hard-codes a length; use a scale step or a `--size-*` / `--text-*` variable (ADR 0501).",
      numericLength:
        "`{{key}}: {{value}}` hard-codes a length; read it from `nativeTokens(theme)` (ADR 0501).",
    },
    schema: [],
  },
  create(context) {
    return {
      ...stringVisitors(reportFirstMatch(context, LITERAL, "lengthClass")),
      Property(node) {
        const hit = numericStyleProperty(node, (key) => LENGTH_KEY.test(key));
        if (hit !== undefined)
          context.report({
            node,
            messageId: "numericLength",
            data: { key: hit.key, value: String(hit.value) },
          });
      },
    };
  },
};
