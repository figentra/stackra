/**
 * Stackra file contract:
 * Purpose: `@Meter(options)`, the class facet by which a model declares a usage meter over its rows: a write of the
 *          model emits `usage.recorded.v1` through the outbox in the same transaction, and the usage service
 *          aggregates it.
 * Boundary: made with `createDecorator`, so it records metadata only; repeatable, kept in source order. It checks the
 *           key and that the field matches the kind; emitting and aggregating are the pipeline's and the usage
 *           service's. It may mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1, 2 and 4); ADR 0294 (decision 6: class facets).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";
import { MeterKind } from "@stackra/contracts";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { MeterOptions } from "#core/types/meter-options.type";

/** A meter key: snake_case segments joined by dots. */
const KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/** A camelCase property name. */
const PROPERTY = /^[a-z][a-zA-Z0-9]{0,62}$/;

/** The recording decorator: the full list of a class's meters. */
const METER = createDecorator<readonly MeterOptions[]>({
  kind: "meter",
  target: DecoratorTarget.Class,
  kinds: MODEL_KINDS,
});

/**
 * Declares a usage meter over the model's rows.
 *
 * @throws TypeError for a key that is not dotted snake_case, a `count` with a field, another kind without one, or a
 *         field that is not a camelCase property name; at class definition, when applied to anything but a model.
 * @example
 * ```ts
 * @Meter({ key: "matters.active", kind: MeterKind.Count })
 * @Meter({ key: "storage.bytes", kind: MeterKind.Sum, field: "sizeBytes", window: Duration.parse("P30D") })
 * export class Matter extends Model.with(HasPublicId("mat")) {}
 * ```
 */
export function Meter(options: MeterOptions): DecoratorFunction {
  if (!KEY.test(options.key))
    throw new TypeError(`@Meter: "${options.key}" is not a dotted snake_case meter key`);
  if (options.kind === MeterKind.Count && options.field !== undefined)
    throw new TypeError(`@Meter: the count meter "${options.key}" reads no field`);
  if (options.kind !== MeterKind.Count && options.field === undefined)
    throw new TypeError(`@Meter: the ${options.kind} meter "${options.key}" needs a field`);
  if (options.field !== undefined && !PROPERTY.test(options.field))
    throw new TypeError(`@Meter: "${options.field}" is not a camelCase property name`);
  const meter: MeterOptions = Object.freeze({ ...options });
  return ((target: object, property?: string | symbol, descriptor?: PropertyDescriptor): void => {
    // Decorators apply bottom-up, so prepending keeps the meters in source order.
    const before = property === undefined ? (METER.on(target as AnyClass) ?? []) : [];
    if (before.some((known) => known.key === meter.key))
      throw new TypeError(`@Meter: "${meter.key}" is declared twice`);
    const apply = METER(Object.freeze([meter, ...before])) as (
      target: object,
      property?: string | symbol,
      descriptor?: PropertyDescriptor,
    ) => void;
    apply(target, property, descriptor);
  }) as DecoratorFunction;
}

/** The meters declared on `type` (or its nearest decorated ancestor), in source order; empty for none. */
Meter.on = (type: AnyClass): readonly MeterOptions[] => METER.on(type) ?? [];
