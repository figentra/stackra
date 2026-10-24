/**
 * Stackra file contract:
 * Purpose: `@Setting({ scopes, lockable, approval, client })`, the decorator that narrows one setting field: on a
 *          settings class, or on a section's schema class.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen, the generated
 *           settings operations and `Setting.members(Class)` read them. It fits a field of any type (a section field
 *           too). On a settings class it checks, when the class is defined, that its scopes are the class's; on a
 *           section the class's scopes are not known until gen reads the tree, so gen checks them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22); ADR 0294 (decisions 6 and 16, the decorator test); ADR 0005 (legacy
 *                     decorators).
 */
import { createDecorator, DecoratorTarget, kindOf } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

import type { SettingOptions } from "#core/types/setting-options.type";

/** The recording decorator; `Setting` checks the options, then applies it. */
const SETTING = createDecorator<SettingOptions>({
  kind: "setting",
  target: DecoratorTarget.Field,
  kinds: ["settings", "schema"],
});

/**
 * Narrows one setting field.
 *
 * @throws RangeError when `scopes` is empty, or, on a settings class, names a level the class does not hold.
 * @example
 * ```ts
 * @Int({ min: 0 })
 * @Setting({ scopes: [SettingScope.Platform], approval: true })
 * dailyRevenueTargetMinor: number | null = null;
 * ```
 */
export function Setting(options: SettingOptions = {}): FieldDecorator<unknown> {
  const { scopes } = options;
  if (scopes?.length === 0)
    throw new RangeError(
      "@Setting({ scopes }) names at least one level; leave it out to keep the class's",
    );
  const record = SETTING(
    Object.freeze(
      scopes === undefined ? { ...options } : { ...options, scopes: Object.freeze([...scopes]) },
    ),
  );
  return ((target: object, property: string) => {
    const owner = (target as { readonly constructor: { readonly name: string } }).constructor;
    const kind = kindOf(owner);
    if (scopes !== undefined && kind?.kind === "settings") {
      const held = kind.options["scopes"] as readonly string[];
      const outside = scopes.filter((scope) => !held.includes(scope));
      if (outside.length > 0)
        throw new RangeError(
          `@Setting on ${owner.name}.${property} names ${outside.join(", ")}, outside the class's scopes (${held.join(", ")})`,
        );
    }
    record(target, property);
  }) as unknown as FieldDecorator<unknown>;
}

/** The options recorded on each field of a class and its ancestors. */
Setting.members = SETTING.members;
