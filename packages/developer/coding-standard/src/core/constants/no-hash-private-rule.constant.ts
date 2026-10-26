/**
 * Stackra file contract:
 * Purpose: the `stackra/no-hash-private` rule: a class member is private through the `private` keyword, never an
 *          ECMAScript `#name`, so the container, gen and tests can read the member.
 * Boundary: syntax only; reports each `#name` member declaration once (not every use) and offers no autofix,
 *           because renaming every use is a refactor.
 * Runtime: isomorphic
 * Governing contract: ADR 0128 (decision 3); ADR 0129 (decision 1).
 */
import { bodyOf } from "../functions/body-of.function.ts";
import type { Rule } from "#core/types/rule.type";

/** Refuses `#private` class members. */
export const NO_HASH_PRIVATE_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow #private class members; use the private keyword (ADR 0128 decision 3).",
    },
    messages: {
      noHashPrivate:
        "`#{{name}}` is an ECMAScript private member; write `private {{name}}` instead (ADR 0128 decision 3).",
    },
    schema: [],
  },
  create(context) {
    return {
      ClassBody(node) {
        for (const member of bodyOf(node)) {
          if (member.key?.type !== "PrivateIdentifier") continue;
          context.report({
            node: member.key,
            messageId: "noHashPrivate",
            data: { name: member.key.name ?? "" },
          });
        }
      },
    };
  },
};
