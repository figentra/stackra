/**
 * Stackra file contract:
 * Purpose: the `stackra/one-declaration-per-file` rule: a file exports exactly one declaration, so its name and kind
 *          say everything it holds (lint's half of gen's `two_declarations_in_file`).
 * Boundary: counts exported names. Declarations that share a name count once: an enum's `const` and its same-named
 *           `type`, function overloads and merged interfaces. A re-export (`export { X } from`, `export * from`) is
 *           not a declaration, so a stand-in barrel passes; `export default X` of an exported name adds nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0294 (rule R2).
 */
import { bodyOf } from "#core/functions/body-of.function";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** The exported names of one top-level statement, each with the node to report on. */
const exportedNames = (statement: AstNode): Array<[string, AstNode]> => {
  if (statement.type === "ExportDefaultDeclaration") {
    const declaration = statement.declaration;
    if (declaration?.type === "Identifier") return [[declaration.name ?? "default", declaration]];
    return [[declaration?.id?.name ?? "default", declaration ?? statement]];
  }
  if (statement.type !== "ExportNamedDeclaration" || statement.source) return [];
  const declaration = statement.declaration;
  if (!declaration) {
    return (statement.specifiers ?? []).map((specifier) => [
      specifier.local?.name ?? "",
      specifier,
    ]);
  }
  if (declaration.declarations) {
    return declaration.declarations.map((declarator) => [declarator.id?.name ?? "", declarator]);
  }
  return [[declaration.id?.name ?? "", declaration]];
};

/** Requires one exported declaration per file. */
export const ONE_DECLARATION_PER_FILE_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require each file to export exactly one declaration (ADR 0305 rules 10 to 13).",
    },
    messages: {
      secondDeclaration:
        "This file already exports `{{first}}`; move `{{name}}` to its own file named after it " +
        "(ADR 0305 rules 10 to 13).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        let first: string | undefined;
        for (const statement of bodyOf(program)) {
          for (const [name, node] of exportedNames(statement)) {
            first ??= name;
            if (name === first) continue;
            context.report({ node, messageId: "secondDeclaration", data: { first, name } });
          }
        }
      },
    };
  },
};
