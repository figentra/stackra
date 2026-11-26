/**
 * Stackra file contract:
 * Purpose: `DEPRECATABLE_KINDS`, the kind codes the class form of `@Deprecated` may mark: every kind whose identity the
 *          manifest locks (`IDENTITY_KINDS`: actions, queries, events, models, ...), a settings group and
 *          a service another class injects.
 * Boundary: codes only. A field is deprecated on a shape kind (`SHAPE_KINDS`); a trait through `createTrait`'s
 *           `deprecated` option, since a trait is a value, not a class.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4: an action, event, field, setting or trait); ADR 0294 (decision 6: a class
 *                     facet); STA-2836.
 */
import { IDENTITY_KINDS } from "#core/constants/identity-kinds.constant";

/** The kind codes of classes `@Deprecated` may mark. */
export const DEPRECATABLE_KINDS: readonly string[] = Object.freeze(
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  [...new Set([...IDENTITY_KINDS, "service", "settings"])].sort(),
);
