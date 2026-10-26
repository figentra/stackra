/**
 * Stackra file contract:
 * Purpose: the `stackra/no-empty-module` rule: a `<key>.module.ts` whose class states nothing gen cannot derive
 *          (a bare `extends Module` or `Module({})` with an empty body) is deleted, because a module is a folder.
 * Boundary: checks top-level classes in `.module.ts` files only; a module with options or members passes.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 15, an empty module file fails lint as `empty_module`).
 */
import { bodyOf } from "../functions/body-of.function.ts";
import { fileKind } from "../functions/file-kind.function.ts";
import { rootIdentifier } from "../functions/root-identifier.function.ts";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** Whether `extends` is `Module`, `Module()` or `Module({})`. */
const isBareModule = (superClass: AstNode | null | undefined): boolean => {
  if (rootIdentifier(superClass) !== "Module") return false;
  if (superClass?.type !== "CallExpression") return superClass?.type === "Identifier";
  const args = superClass.arguments ?? [];
  const [first] = args;
  return (
    args.length === 0 ||
    (args.length === 1 &&
      first?.type === "ObjectExpression" &&
      (first.properties ?? []).length === 0)
  );
};

/** Refuses module files that state nothing. */
export const NO_EMPTY_MODULE_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a module file that states nothing gen cannot derive (ADR 0305 rule 15).",
    },
    messages: {
      emptyModule:
        "`{{name}}` states nothing gen cannot derive; delete the file, the module is its folder " +
        "(ADR 0305 rule 15, empty_module).",
    },
    schema: [],
  },
  create(context) {
    if (fileKind(context.filename) !== "module") return {};
    return {
      Program(program) {
        for (const statement of bodyOf(program)) {
          const node = statement.type === "ClassDeclaration" ? statement : statement.declaration;
          if (node?.type !== "ClassDeclaration" || !isBareModule(node.superClass)) continue;
          if (bodyOf(node).length > 0) continue;
          context.report({
            node: node.id ?? node,
            messageId: "emptyModule",
            data: { name: node.id?.name ?? "" },
          });
        }
      },
    };
  },
};
