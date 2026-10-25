/**
 * Stackra file contract:
 * Purpose: the `stackra/no-raw-key-literal` rule: a string literal in an icon, column-key, route-key or permission
 *          position is reported; the position takes the constant gen emits (`Icons.House`, a typed key object).
 * Boundary: reads object properties named `icon`, `columnKey`, `routeKey`, `permission` and `permissions` (an array
 *           of literals counts per element). A file named `*.generated.*` or under `generated/` is exempt, because
 *           gen writes the constants there. No autofix: the constant's name is gen's.
 * Runtime: isomorphic
 * Governing contract: owner decision R-56 (2026-10-24 final review, supersedes R-15); registry v3.1 (notes);
 *                     ADR 0322 (generated key constants).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

const POSITIONS = new Set(["icon", "columnKey", "routeKey", "permission", "permissions"]);
const GENERATED_FILE = /(?:\.generated\.|(?:^|[\\/])generated[\\/])/;

/** Whether `node` is a string literal. */
const isString = (node: AstNode | null | undefined): node is AstNode =>
  node?.type === "Literal" && typeof node.value === "string";

/** The property's name, from an identifier or a string key. */
const keyName = (node: AstNode): string | undefined => {
  const key = node.key;
  if (key?.type === "Identifier") return key.name;
  return isString(key) ? (key.value as string) : undefined;
};

/** Refuses raw string literals where a generated key constant belongs. */
export const NO_RAW_KEY_LITERAL_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow string literals in icon, column-key, route-key and permission positions (owner R-56, ADR 0322).",
    },
    messages: {
      rawKey:
        "`{{position}}` takes a generated constant, not the literal {{literal}} (owner decision R-56, ADR 0322).",
    },
    schema: [],
  },
  create(context) {
    if (GENERATED_FILE.test(context.filename)) return {};
    return {
      Property(node) {
        const position = keyName(node);
        if (position === undefined || !POSITIONS.has(position)) return;
        const value = node.value as AstNode | undefined;
        const literals = value?.type === "ArrayExpression" ? (value.elements ?? []) : [value];
        for (const literal of literals) {
          if (isString(literal)) {
            context.report({
              node: literal,
              messageId: "rawKey",
              data: { position, literal: JSON.stringify(literal.value) },
            });
          }
        }
      },
    };
  },
};
