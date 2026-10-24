/**
 * Stackra file contract:
 * Purpose: `@Renamed(old)`, the rename marker: on a class or a field, it names the identity
 *          `stackra.manifest.json` locked before a rename, so `stackra gen --check` accepts the change and records it.
 * Boundary: two recording decorators made with `createDecorator`, one per target, behind one function that picks by
 *           how it is applied. The class form may mark the kinds whose identity the manifest locks; the field form the
 *           shape kinds. It records only and fits a field of any type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 5, 6 and 22: a changed identity needs `@Renamed(old)`).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";

import { IDENTITY_KINDS } from "#core/constants/identity-kinds.constant";
import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";

/** The class form. */
const ON_CLASS = createDecorator<string>({
  kind: "renamed",
  target: DecoratorTarget.Class,
  kinds: IDENTITY_KINDS,
});

/** The field form. */
const ON_FIELD = createDecorator<string>({
  kind: "renamed",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Names the identity a class or a field had before it was renamed.
 *
 * @param old - the previous identity: a block key (`"web.hero"`), a field name (`"orderUpdates"`).
 * @example
 * ```ts
 * @Renamed("web.hero")
 * export class HeroSectionBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {}
 *
 * @Renamed("orderUpdates")
 * updates = true;
 * ```
 */
export function Renamed(old: string): DecoratorFunction {
  return ((target: object, property?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (property === undefined) ON_CLASS(old)(target as AnyClass);
    // With a descriptor (a method) the field form throws: a method is neither form.
    else ON_FIELD(old)(target, property, descriptor as PropertyDescriptor);
  }) as DecoratorFunction;
}

/** The previous identity recorded on a class or its nearest renamed ancestor. */
Renamed.on = ON_CLASS.on;

/** The previous names recorded on each field of a class and its ancestors. */
Renamed.members = ON_FIELD.members;
