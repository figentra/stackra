/**
 * Stackra file contract:
 * Purpose: the `stackra/hook-file-name` rule: an exported React hook `use<Name>` lives in `use-<name>.ts(x)`, so a
 *          reader finds a hook by its file name and a file name says what it exports.
 * Boundary: reads the file name and the top-level exports; a platform suffix (`.native`, `.web`, `.ios`,
 *           `.android`) before the extension is ignored. No autofix: renaming a file is not a lint fix.
 * Runtime: isomorphic
 * Governing contract: ADR 0128 (decision 5, amendment 2026-10-21); ADR 0294 (rule R7, hooks are `use-<name>.ts`);
 *                     ADR 0129 (decision 1).
 */
import { baseName } from "../functions/base-name.function.ts";
import { bodyOf } from "../functions/body-of.function.ts";
import { kebabCase } from "../functions/kebab-case.function.ts";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

const HOOK_NAME = /^use[A-Z0-9]/;
const SOURCE_EXTENSION = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const PLATFORM_SUFFIX = /\.(?:native|web|ios|android)$/;
const FUNCTION_TYPES = new Set(["ArrowFunctionExpression", "FunctionExpression"]);

/** The exported hook name nodes of one top-level statement. */
const exportedHooks = (statement: AstNode): AstNode[] => {
  if (statement.type !== "ExportNamedDeclaration" && statement.type !== "ExportDefaultDeclaration")
    return [];
  const declaration = statement.declaration;
  if (!declaration) return [];
  const ids: AstNode[] = [];
  if (declaration.type === "FunctionDeclaration" && declaration.id) ids.push(declaration.id);
  for (const declarator of declaration.declarations ?? []) {
    if (declarator.id?.type === "Identifier" && FUNCTION_TYPES.has(declarator.init?.type ?? "")) {
      ids.push(declarator.id);
    }
  }
  return ids.filter((id) => HOOK_NAME.test(id.name ?? ""));
};

/** Requires `use<Name>` exports to sit in `use-<name>.ts(x)`. */
export const HOOK_FILE_NAME_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an exported React hook use<Name> to live in use-<name>.ts (ADR 0128 decision 5).",
    },
    messages: {
      wrongFile:
        "`{{name}}` is a React hook, so it lives in `{{expected}}.ts` or `{{expected}}.tsx`, not `{{actual}}` " +
        "(ADR 0128 decision 5, ADR 0294 R7).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const file = baseName(context.filename);
        const stem = file.replace(SOURCE_EXTENSION, "").replace(PLATFORM_SUFFIX, "");
        for (const statement of bodyOf(node)) {
          for (const id of exportedHooks(statement)) {
            const expected = kebabCase(id.name ?? "");
            if (stem === expected) continue;
            context.report({
              node: id,
              messageId: "wrongFile",
              data: { name: id.name ?? "", expected, actual: file },
            });
          }
        }
      },
    };
  },
};
