/**
 * Stackra file contract:
 * Purpose: `createDecorator`, the one way to make a decorator (ADR 0294 R6): a class facet, a field decorator or a
 *          method decorator, registered with the kinds it may mark. The decorator is its own metadata key: the
 *          Explorer that acts on it, `DiscoveryService` and gen look up the decorator itself.
 * Boundary: the decorator records its value and nothing else: no accessor, no wrapper, no reflect-metadata. Applied
 *           to a target it was not made for, or to a class outside its kinds, it throws a TypeError at class
 *           definition, so the mistake surfaces on import.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6); ADR 0144 (Explorers) as amended by 0263; ADR 0005 (legacy decorators).
 */
import { DecoratorTarget } from "#core/enums/decorator-target.enum";
import { kindOf } from "#core/functions/kind-of.function";
import type { AnyClass } from "#core/types/any-class.type";
import type { Decorator } from "#core/types/decorator.type";
import type { DecoratorDefinition } from "#core/types/decorator-definition.type";
import type { DecoratorFunction } from "#core/types/decorator-function.type";

/** The constructor chain of `type`, from the class itself up to its root. */
function chainOf(type: object): object[] {
  const chain: object[] = [];
  for (
    let current: object | null = type;
    current !== null && current !== Function.prototype;
    current = Object.getPrototypeOf(current) as object | null
  )
    chain.push(current);
  return chain;
}

/**
 * Makes a decorator that takes a value of type `V`.
 *
 * @param definition - the decorator's kind code, its target and the kinds of class it may mark.
 * @returns the decorator, which also reads back what it recorded (`on` for a class, `members` for fields and methods).
 * @throws TypeError when `definition.kinds` is empty.
 * @example
 * export const AccessLogged = createDecorator<AccessLoggedOptions>({
 *   kind: "access_logged",
 *   target: "class",
 *   kinds: ["action", "query", "service"],
 * });
 */
export function createDecorator<V>(definition: DecoratorDefinition): Decorator<V> {
  if (definition.kinds.length === 0)
    throw new TypeError(`@${definition.kind} must name at least one kind it may mark`);
  const kinds = Object.freeze([...definition.kinds]);
  const onClasses = new WeakMap<object, V>();
  const onMembers = new WeakMap<object, Map<string | symbol, V>>();

  const apply = (value: V) =>
    ((target: object, property?: string | symbol, descriptor?: PropertyDescriptor): void => {
      const actual =
        property === undefined
          ? DecoratorTarget.Class
          : descriptor === undefined
            ? DecoratorTarget.Field
            : DecoratorTarget.Method;
      const type =
        property === undefined ? target : (target as { constructor: object }).constructor;
      const name = (type as { name?: string }).name ?? "an anonymous class";
      if (actual !== definition.target)
        throw new TypeError(
          `@${definition.kind} decorates a ${definition.target}, not a ${actual} (${name})`,
        );
      const kind = kindOf(type)?.kind;
      if (kind === undefined || !kinds.includes(kind))
        throw new TypeError(
          `@${definition.kind} may mark ${kinds.join(", ")}; ${name} is ${kind === undefined ? "of no kind" : `a ${kind}`}`,
        );
      if (property === undefined) {
        onClasses.set(type, value);
        return;
      }
      const members = onMembers.get(type) ?? new Map<string | symbol, V>();
      members.set(property, value);
      onMembers.set(type, members);
    }) as DecoratorFunction;

  // Not frozen: a facet such as `Lifetime` adds its codes to the decorator before freezing it.
  return Object.assign(apply, {
    kind: definition.kind,
    target: definition.target,
    kinds,
    on(type: AnyClass): V | undefined {
      for (const current of chainOf(type))
        if (onClasses.has(current)) return onClasses.get(current);
      return undefined;
    },
    members(type: AnyClass): ReadonlyMap<string | symbol, V> {
      const merged = new Map<string | symbol, V>();
      for (const current of chainOf(type).reverse())
        for (const [member, value] of onMembers.get(current) ?? []) merged.set(member, value);
      return merged;
    },
  }) as Decorator<V>;
}
