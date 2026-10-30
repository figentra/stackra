/**
 * Stackra file contract:
 * Purpose: the `stackra/no-literal-radius` rule: a shape comes from the `--radius-*` tokens through a `@stackra/ui`
 *          component, never from a Tailwind `rounded-*` class literal or a numeric `borderRadius`, so a brand family
 *          (Jute square, Organza round) reshapes every surface at once.
 * Boundary: syntax only; reads string literals, template text and `border*Radius` properties; a class that reads a
 *           token (`rounded-[var(--radius-*)]`), `rounded-none` and `rounded-[inherit]` pass. Where it runs is the
 *           preset's choice (base.jsonc turns it off outside apps/ and packages/design-system/). A bare `rounded`
 *           counts only inside a `className` attribute, so prose saying "rounded" passes. No autofix: the right
 *           token or component is a design choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (tokens own the shape); ADR 0129 (house rules as an oxlint jsPlugin); showcase
 *                     redesign spec section 8 (WP0 lint guard).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** A `rounded-*` utility token, with any variant prefixes (`md:`, `hover:`) and the `!` modifier. */
const DASHED = /(?:^|\s)(?:[\w-]+:)*!?(rounded-[^\s"'`]+)/g;

/** A bare `rounded` utility token. */
const BARE = /(?:^|\s)(?:[\w-]+:)*!?(rounded)(?=\s|$)/;

/**
 * A `rounded-*` token that hard-codes nothing: no radius (`none`, a flat attached edge), the parent's (`[inherit]`),
 * or an arbitrary value read from a token (`[var(--radius-container)]`), the fix this rule asks for.
 */
const TOKEN_DRIVEN = /^rounded(?:-[a-z]{1,2})?-(?:none|\[inherit\]|\[[^\]]*var\(--[^\]]*\])$/;

/** The first `rounded-*` token in `text` that hard-codes a radius. */
const literalRadius = (text: string): string | undefined =>
  [...text.matchAll(DASHED)]
    .map((match) => match[1] ?? "")
    .find((token) => !TOKEN_DRIVEN.test(token));

/** A style key that sets a corner radius (`borderRadius`, `borderTopStartRadius`, ...). */
const RADIUS_KEY = /^border\w*Radius$/;

/** Refuses literal radii. */
export const NO_LITERAL_RADIUS_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow rounded-* class literals and numeric borderRadius; radii come from --radius-* tokens (ADR 0302).",
    },
    messages: {
      roundedClass:
        "`{{token}}` hard-codes a radius; use the `@stackra/ui` component that owns the shape so the `--radius-*` " +
        "tokens apply (ADR 0302).",
      numericRadius:
        "`{{key}}: {{value}}` hard-codes a radius; use the `@stackra/ui` component or a `--radius-*` token (ADR 0302).",
    },
    schema: [],
  },
  create(context) {
    const check = (node: AstNode, text: string): void => {
      const attribute = node.parent;
      const inClassName =
        attribute?.type === "JSXAttribute" &&
        (attribute.name as unknown as AstNode | undefined)?.name === "className";
      const token = literalRadius(text) ?? (inClassName ? BARE.exec(text)?.[1] : undefined);
      if (token !== undefined) context.report({ node, messageId: "roundedClass", data: { token } });
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        const cooked = (node.value as { cooked?: string | null } | undefined)?.cooked;
        if (typeof cooked === "string") check(node, cooked);
      },
      Property(node) {
        const key = node.key?.type === "Identifier" ? node.key.name : node.key?.value;
        const value = node.value as AstNode | undefined;
        // `-4` parses as a UnaryExpression around the literal
        const literal = value?.type === "UnaryExpression" ? value.argument : value;
        if (
          typeof key === "string" &&
          RADIUS_KEY.test(key) &&
          literal?.type === "Literal" &&
          typeof literal.value === "number"
        )
          context.report({
            node,
            messageId: "numericRadius",
            data: { key, value: String(literal.value) },
          });
      },
    };
  },
};
