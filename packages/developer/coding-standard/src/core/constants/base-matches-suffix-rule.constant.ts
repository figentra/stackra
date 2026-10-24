/**
 * Stackra file contract:
 * Purpose: the `stackra/base-matches-suffix` rule: a top-level class in `<name>.<kind>.ts` extends that kind's base
 *          (`cancel-order.action.ts` extends `Action({ ... })`), so the path and the class state one kind.
 * Boundary: syntax only; the base is the root identifier of the `extends` expression, never a resolved import (gen's
 *           `kind_unregistered_base` resolves it). Also accepted: an override's `Base<Name>` alias (ADR 0305 rule 1),
 *           a class of the same kind (its name ends in `PascalCase(kind)`, such as a package's config class or an
 *           `Error`; not for the noun kinds, whose classes carry no suffix), and for a schema, a sibling schema
 *           imported by a relative or `#` path (ADR 0294 2026-10-23 item 13).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rules R1 and R3, decision 16); ADR 0305 (rules 1 to 3).
 */
import { KIND_BASES } from "#core/constants/kind-bases.constant";
import { bodyOf } from "#core/functions/body-of.function";
import { fileKind } from "#core/functions/file-kind.function";
import { pascalCase } from "#core/functions/pascal-case.function";
import { rootIdentifier } from "#core/functions/root-identifier.function";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

const OVERRIDE_ALIAS = /^Base[A-Z]/;
const LOCAL_SOURCE = /^(?:\.{1,2}\/|#)/;
const CLASS_TYPES = new Set(["ClassDeclaration", "ClassExpression"]);
// Noun kinds name no suffix on their classes (ADR 0294 R2), so "a class of the same kind" cannot be read from a name.
const NOUN_KINDS = new Set(["model", "schema", "event", "signal", "analytics-event"]);

/** The top-level classes of a program, exported or not. */
const topLevelClasses = (program: AstNode): AstNode[] =>
  bodyOf(program)
    .map((statement) => (CLASS_TYPES.has(statement.type) ? statement : statement.declaration))
    .filter(
      (node): node is AstNode => node !== null && node !== undefined && CLASS_TYPES.has(node.type),
    );

/** The local names imported from a relative or `#` path. */
const localImports = (program: AstNode): Set<string> => {
  const names = new Set<string>();
  for (const statement of bodyOf(program)) {
    if (
      statement.type !== "ImportDeclaration" ||
      !LOCAL_SOURCE.test(String(statement.source?.value ?? ""))
    )
      continue;
    for (const specifier of statement.specifiers ?? []) names.add(specifier.local?.name ?? "");
  }
  return names;
};

/** Requires a kind file's class to extend its kind base. */
export const BASE_MATCHES_SUFFIX_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a class in <name>.<kind>.ts to extend the kind's base class (ADR 0294 R3).",
    },
    messages: {
      missingBase:
        "`{{name}}` sits in a `.{{kind}}.ts` file, so it extends {{expected}} (ADR 0294 R3).",
      wrongBase:
        "`{{name}}` sits in a `.{{kind}}.ts` file, so it extends {{expected}}, not `{{actual}}` (ADR 0294 R3).",
    },
    schema: [],
  },
  create(context) {
    const kind = fileKind(context.filename);
    const bases = kind === undefined ? undefined : KIND_BASES[kind];
    if (kind === undefined || bases === undefined) return {};
    const sameKindSuffix = pascalCase(kind);
    const expected = bases.map((base) => `\`${base}\``).join(" or ");
    return {
      Program(program) {
        const locals = localImports(program);
        for (const node of topLevelClasses(program)) {
          const name = node.id?.name ?? "default";
          const actual = rootIdentifier(node.superClass);
          if (actual === undefined) {
            context.report({
              node: node.id ?? node,
              messageId: "missingBase",
              data: { name, kind, expected },
            });
            continue;
          }
          const isAllowed =
            bases.includes(actual) ||
            OVERRIDE_ALIAS.test(actual) ||
            (!NOUN_KINDS.has(kind) && actual.endsWith(sameKindSuffix)) ||
            (kind === "schema" && locals.has(actual));
          if (isAllowed) continue;
          context.report({
            node: node.superClass ?? node,
            messageId: "wrongBase",
            data: { name, kind, expected, actual },
          });
        }
      },
    };
  },
};
