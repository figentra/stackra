/**
 * Stackra file contract:
 * Purpose: the `feature-flags/no-plan-targeting` rule: a flag is a release switch or an experiment arm, never a
 *          commercial right, so a flag may not be named for a plan, tier, edition, entitlement or subscription, and
 *          its `Flag({...})` options may not carry a key of that kind. A paid feature is an entitlement.
 * Boundary: syntax only; it reads the class name of `extends Flag(...)` and the keys of the `Flag(...)` options object.
 *           The words are the commercial vocabulary of ADR 0213 decision 7, not a business value; no autofix (moving a
 *           flag to an entitlement is a design change).
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 7: flags are not entitlements); ADR 0129 (house rules as an oxlint jsPlugin).
 */
import type { LintNode } from "#lint/types/lint-node.type";
import type { LintRule } from "#lint/types/lint-rule.type";

/** A commercial word as a PascalCase part of a class name. */
const COMMERCIAL_NAME =
  /(?:^|[a-z0-9])(Plans?|Tiers?|Editions?|Entitlements?|Subscriptions?)(?=[A-Z]|$)/;

/** A commercial word as an options key. */
const COMMERCIAL_KEY = /^(plans?|tiers?|editions?|entitlements?|subscriptions?)$/i;

/** The name of a property key: an identifier or a string literal. */
const keyName = (key: LintNode | undefined): string | undefined =>
  key?.type === "Identifier" ? key.name : typeof key?.value === "string" ? key.value : undefined;

/** Refuses plan targeting on flags. */
export const NO_PLAN_TARGETING_RULE: LintRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow targeting a feature flag by plan, tier, edition or entitlement (ADR 0213 decision 7).",
    },
    messages: {
      planName:
        "`{{name}}` names a flag after a commercial right (`{{word}}`); a flag is a release switch, sell the feature " +
        "with an entitlement (ADR 0213 decision 7).",
      planOption:
        "`Flag({ {{word}} })` targets a flag by a commercial right; a flag is a release switch, sell the feature with " +
        "an entitlement (ADR 0213 decision 7).",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee?.type !== "Identifier" || node.callee.name !== "Flag") return;
        for (const property of node.arguments?.[0]?.properties ?? []) {
          const word = keyName(property.key);
          if (word !== undefined && COMMERCIAL_KEY.test(word))
            context.report({ node: property, messageId: "planOption", data: { word } });
        }
        const owner = node.parent;
        const name = owner?.superClass === node ? owner.id?.name : undefined;
        const match = name === undefined ? null : COMMERCIAL_NAME.exec(name);
        if (owner !== null && owner !== undefined && name !== undefined && match !== null)
          context.report({
            node: owner,
            messageId: "planName",
            data: { name, word: match[1] ?? "" },
          });
      },
    };
  },
};
