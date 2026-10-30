/**
 * Stackra file contract:
 * Purpose: the `stackra/no-tenant-vocabulary` rule: an identifier that contains `tenant` is declared only in
 *          `@stackra/tenancy` and the scope code of `@stackra/iam`; other code names the scope with `ScopeRef`.
 * Boundary: reports declarations only, case-insensitively: the name of a class, interface, type alias, enum, enum
 *           member, function, variable (destructured bindings included), parameter, class field, accessor or method,
 *           interface member, and the file name. Never reported: an import or re-export, any use of a name (a
 *           reference, a type reference, a member access such as `TenancyScopes.Tenant`) and an object literal key,
 *           which conforms to a type declared elsewhere, except a key of `Enum.of({ ... })`, the house enum member. Strings and comments are not read. Exempt paths:
 *           `packages/<group>/tenancy/`, a product's tenancy service (`services/tenancy/`), the IAM scope code (under `packages/<group>/iam/`, a folder or file whose
 *           name contains `scope`, such as `iam-granted-scopes.driver.ts`), generated code under `.stackra/`,
 *           `lang/` and `docs/` folders, and this rule's own source and test. No autofix: a rename is not a lint fix.
 * Runtime: isomorphic
 * Governing contract: ADR 0323 (decisions 1 and 5); owner decisions H and R-59 (2026-10-24 final review);
 *                     owner decision of 2026-10-30 (the OS tenancy service is exempt).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

const TENANT = /tenant/i;
const EXEMPT_PATHS = [
  /(?:^|[\\/])packages[\\/](?:[^\\/]+[\\/])?tenancy[\\/]/,
  // The OS tenancy service implements tenancy, as the package does.
  /(?:^|[\\/])services[\\/]tenancy[\\/]/,
  /(?:^|[\\/])packages[\\/](?:[^\\/]+[\\/])?iam[\\/](?:[^\\/]+[\\/])*[^\\/]*scope/i,
  /(?:^|[\\/])\.stackra[\\/]/,
  /(?:^|[\\/])(?:lang|docs)[\\/]/,
  // The rule's own source and test carry its name.
  /[\\/]no-tenant-vocabulary-rule\.constant(?:\.test)?\.ts$/,
];

/** Parents whose `id` names what they declare. */
const DECLARED_BY_ID = new Set([
  "ClassDeclaration",
  "ClassExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration",
  "TSEnumMember",
  "VariableDeclarator",
]);

/** Members whose non-computed `key` names what they declare. */
const DECLARED_BY_KEY = new Set([
  "PropertyDefinition",
  "AccessorProperty",
  "MethodDefinition",
  "TSPropertySignature",
  "TSMethodSignature",
  "TSAbstractPropertyDefinition",
  "TSAbstractAccessorProperty",
  "TSAbstractMethodDefinition",
]);

/** Whether an object literal is the member list of a house enum, `Enum.of({ ... })` (ADR 0128). */
function isEnumBody(object: AstNode | null | undefined): boolean {
  const call = object?.parent;
  return (
    call?.type === "CallExpression" &&
    call.arguments?.[0] === object &&
    call.callee?.type === "MemberExpression" &&
    call.callee.object?.name === "Enum" &&
    call.callee.property?.name === "of"
  );
}

/** Whether this identifier is the name a declaration introduces, not a use of a name. */
function declares(node: AstNode): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (parent.params?.includes(node)) return true;
  if (DECLARED_BY_ID.has(parent.type)) return parent.id === node;
  if (DECLARED_BY_KEY.has(parent.type)) return parent.key === node && parent.computed !== true;
  switch (parent.type) {
    case "TSParameterProperty": {
      return true;
    }
    case "AssignmentPattern": {
      return parent.left === node;
    }
    case "RestElement": {
      return parent.argument === node;
    }
    case "ArrayPattern": {
      return parent.elements?.includes(node) ?? false;
    }
    case "Property": {
      if (parent.parent?.type === "ObjectPattern") return parent.value === node;
      return parent.key === node && parent.computed !== true && isEnumBody(parent.parent);
    }
    default: {
      return false;
    }
  }
}

/** Refuses a declaration that says tenant outside tenancy and the IAM scope code. */
export const NO_TENANT_VOCABULARY_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow declaring a tenant identifier outside @stackra/tenancy and the IAM scope code; use ScopeRef (ADR 0323).",
    },
    messages: {
      noTenant:
        "`{{name}}` declares tenant outside @stackra/tenancy; name the scope with `ScopeRef` (ADR 0323, owner decision R-59).",
    },
    schema: [],
  },
  create(context) {
    if (EXEMPT_PATHS.some((path) => path.test(context.filename))) return {};
    // A shorthand pattern can hand the same name over twice; report each span once.
    const reported = new Set<number>();
    return {
      Program(node) {
        const file = context.filename.split(/[\\/]/).pop() ?? "";
        if (TENANT.test(file))
          context.report({ node, messageId: "noTenant", data: { name: file } });
      },
      Identifier(node) {
        if (node.name === undefined || !TENANT.test(node.name) || !declares(node)) return;
        if (reported.has(node.range[0])) return;
        reported.add(node.range[0]);
        context.report({ node, messageId: "noTenant", data: { name: node.name } });
      },
    };
  },
};
