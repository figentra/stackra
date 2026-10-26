/**
 * Stackra file contract:
 * Purpose: the `stackra/member-order` rule: class members follow the reading order a caller needs: static fields
 *          (readonly first), decorated fields, instance fields (public readonly, public, protected, private), the
 *          constructor, static methods, accessors, lifecycle hooks, then public, protected and private methods.
 * Boundary: reports the first member of each class that sits below a later group; order inside a group (call
 *           flow) is left to review. Index signatures and static blocks are not ranked. No autofix: moving members
 *           moves their comments and is a reviewable change.
 * Runtime: isomorphic
 * Governing contract: ADR 0128 (decision 7, the conventions put in force by ADR 0268 R1); ADR 0129 (decision 1).
 */
import { bodyOf } from "../functions/body-of.function.ts";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

const GROUPS = [
  "static readonly field",
  "static field",
  "decorated field",
  "public readonly field",
  "public field",
  "protected field",
  "private field",
  "constructor",
  "static method",
  "accessor",
  "lifecycle hook",
  "public method",
  "protected method",
  "private method",
] as const;

const LIFECYCLE_HOOKS = new Set([
  "onModuleInit",
  "onModuleDestroy",
  "onApplicationBootstrap",
  "onApplicationShutdown",
]);
const FIELD_TYPES = new Set(["PropertyDefinition", "TSAbstractPropertyDefinition"]);
const ACCESSOR_TYPES = new Set(["AccessorProperty", "TSAbstractAccessorProperty"]);
const METHOD_TYPES = new Set(["MethodDefinition", "TSAbstractMethodDefinition"]);

/** The member's visibility: its keyword, `private` for a `#name`, else `public`. */
const visibilityOf = (member: AstNode): string =>
  member.accessibility ?? (member.key?.type === "PrivateIdentifier" ? "private" : "public");

/** The member's group index in `GROUPS`, or `undefined` for a member that is not ranked. */
const rankOf = (member: AstNode): number | undefined => {
  const visibility = visibilityOf(member);
  if (FIELD_TYPES.has(member.type)) {
    if (member.static) return member.readonly ? 0 : 1;
    if ((member.decorators ?? []).length > 0) return 2;
    if (visibility === "public") return member.readonly ? 3 : 4;
    return visibility === "protected" ? 5 : 6;
  }
  if (ACCESSOR_TYPES.has(member.type)) return 9;
  if (!METHOD_TYPES.has(member.type)) return undefined;
  if (member.kind === "constructor") return 7;
  if (member.static) return 8;
  if (member.kind === "get" || member.kind === "set") return 9;
  if (LIFECYCLE_HOOKS.has(member.key?.name ?? "")) return 10;
  if (visibility === "public") return 11;
  return visibility === "protected" ? 12 : 13;
};

/** A readable name for a member key. */
const nameOf = (member: AstNode): string => {
  const key = member.key;
  if (member.kind === "constructor") return "constructor";
  if (key?.type === "PrivateIdentifier") return `#${key.name ?? ""}`;
  if (key?.type === "Identifier") return key.name ?? "";
  return typeof key?.value === "string" ? key.value : "[computed]";
};

/** Requires class members in the house reading order. */
export const MEMBER_ORDER_RULE: Rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Require class members in the house reading order (ADR 0128, ADR 0129)." },
    messages: {
      outOfOrder:
        "`{{name}}` ({{group}}) comes after `{{previous}}` ({{previousGroup}}); move it up. Order: " +
        GROUPS.join(", ") +
        " (ADR 0128).",
    },
    schema: [],
  },
  create(context) {
    return {
      ClassBody(node) {
        let highest: { rank: number; member: AstNode } | undefined;
        for (const member of bodyOf(node)) {
          const rank = rankOf(member);
          if (rank === undefined) continue;
          if (highest === undefined || rank >= highest.rank) {
            highest = { rank, member };
            continue;
          }
          context.report({
            node: member,
            messageId: "outOfOrder",
            data: {
              name: nameOf(member),
              group: GROUPS[rank] ?? "",
              previous: nameOf(highest.member),
              previousGroup: GROUPS[highest.rank] ?? "",
            },
          });
          return;
        }
      },
    };
  },
};
