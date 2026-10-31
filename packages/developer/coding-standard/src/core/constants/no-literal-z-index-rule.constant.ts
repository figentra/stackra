/**
 * Stackra file contract:
 * Purpose: the `stackra/no-literal-z-index` rule: stacking comes from the theme's layers (`z-(--z-overlay)`), never
 *          from a Tailwind `z-50`, an arbitrary `z-[…]` or a numeric `zIndex`.
 * Boundary: syntax only; reads string literals, template text and object properties. `z-0`, `z-auto` and a variable
 *           pass. No autofix: which layer an element sits on is a design choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, lint rules); ADR 0129 (house rules as an oxlint jsPlugin).
 */
import { reportFirstMatch } from "../functions/report-first-match.function.ts";
import { stringVisitors } from "../functions/string-visitors.function.ts";
import { numericStyleProperty } from "../functions/numeric-style-property.function.ts";
import type { Rule } from "#core/types/rule.type";

/** A `z-<n>` (n > 0) or an arbitrary `z-[…]` that names no variable, with variant prefixes, `!` and a minus. */
const LITERAL =
  /(?:^|\s)(?:(?:[\w-]|\[[^\]]*\])+:)*!?(-?z-(?:[1-9]\d*|\[(?![^\]]*var\(--)[^\]]+\]))(?=[\s"'`]|$)/;

/** Refuses literal z-indices. */
export const NO_LITERAL_Z_INDEX_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow literal z-indices; stacking comes from the theme's `--z-*` layers (ADR 0501).",
    },
    messages: {
      zClass: "`{{token}}` hard-codes a layer; use `z-(--z-<layer>)` (ADR 0501).",
      numericZ:
        "`zIndex: {{value}}` hard-codes a layer; read the theme's `zIndex` layer (ADR 0501).",
    },
    schema: [],
  },
  create(context) {
    return {
      ...stringVisitors(reportFirstMatch(context, LITERAL, "zClass")),
      Property(node) {
        const hit = numericStyleProperty(node, (key) => key === "zIndex");
        if (hit !== undefined)
          context.report({ node, messageId: "numericZ", data: { value: String(hit.value) } });
      },
    };
  },
};
