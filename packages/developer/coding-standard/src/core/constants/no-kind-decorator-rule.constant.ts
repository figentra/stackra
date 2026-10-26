/**
 * Stackra file contract:
 * Purpose: the `stackra/no-kind-decorator` rule: a class states its kind by its base class, so a decorator named
 *          after a kind base (`@Action`, `@Model`) or a retired decorator (`@Injectable`, `@Inject`, `@Cron`) is
 *          refused.
 * Boundary: compares the decorator's root identifier with `KIND_BASES` and `RETIRED_DECORATORS`; it does not resolve
 *           imports, so a local decorator that reuses a retired name is refused too, on purpose (one meaning per word).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R6 and decision 23); ADR 0305 (rule 3).
 */
import { KIND_BASES } from "./kind-bases.constant.ts";
import { RETIRED_DECORATORS } from "./retired-decorators.constant.ts";
import { rootIdentifier } from "../functions/root-identifier.function.ts";
import type { Rule } from "#core/types/rule.type";

const BANNED = new Set([...Object.values(KIND_BASES).flat(), ...RETIRED_DECORATORS]);

/** Refuses kind decorators and retired decorators. */
export const NO_KIND_DECORATOR_RULE: Rule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow decorators named after a kind or retired by v3 (ADR 0294 R6)." },
    messages: {
      kindDecorator:
        "`@{{name}}` is a retired decorator: a class declares its kind by its base class, and only field, " +
        "method and class-facet decorators exist (ADR 0294 R6).",
    },
    schema: [],
  },
  create(context) {
    return {
      Decorator(node) {
        const name = rootIdentifier(node.expression);
        if (name === undefined || !BANNED.has(name)) return;
        context.report({ node, messageId: "kindDecorator", data: { name } });
      },
    };
  },
};
