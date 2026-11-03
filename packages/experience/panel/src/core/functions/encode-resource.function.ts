/**
 * Stackra file contract:
 * Purpose: `encodeResource(tree, keyOf?)`, a recorded resource tree as JSON (`ResourceWire`): every action or query
 *          class written as its versioned key, every enum as its `Enum.of` definition (its case data kept), every field
 *          left `undefined` dropped.
 * Boundary: pure; the tree is not changed. A class's key is its static `key` (a client ref's), or what `keyOf` answers
 *           for an authored class (gen maps class names to locked keys). Throws a `TypeError` naming the path for what
 *           cannot travel: a class with no key, an icon element (an icon travels by name), a non-finite number, or any
 *           object that is not plain data (a `Date`, a `Map`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 5 and 7); ADR 0164 (decision 2); the SDUI catalogue case `resources` (STA-1981,
 *                     build-list item 54).
 */
import type { AnyClass } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import type { ResourceTree } from "#core/types/resource-tree.type";
import type { ResourceWire } from "#core/types/resource-wire.type";

/** A class's static `key`, when it is a string (a client ref's versioned key). */
const staticKey = (type: AnyClass): string | undefined => {
  const key = (type as { readonly key?: unknown }).key;
  return typeof key === "string" ? key : undefined;
};

/** Whether `value` is a plain object: made by a literal, `Object.create(null)` or `Object.freeze` of either. */
const isPlain = (value: object): boolean => {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * The JSON form of the resource tree `tree`.
 *
 * @param keyOf - the versioned key of a class with no static `key`; undefined when it has none.
 * @throws TypeError when a value cannot travel as JSON, naming its path.
 * @example
 * const wire = encodeResource(describeResource(OrderResource));
 * JSON.stringify(wire); // {"options":{"area":"admin","operations":{"list":"orders.order.list@1"}},...}
 */
export function encodeResource(
  tree: ResourceTree,
  keyOf: (type: AnyClass) => string | undefined = staticKey,
): ResourceWire {
  const enumOf = (enumeration: object, path: string): Enum.Definition =>
    Object.fromEntries(
      Object.entries(enumeration).map(([name, code]): [string, Enum.Case] => {
        if (typeof code !== "string") throw new TypeError(`encodeResource: ${path} is not an enum`);
        const meta = Enum.meta(enumeration as Enum.Any, code) as Readonly<Record<string, unknown>>;
        return [
          name,
          Object.keys(meta).length === 0
            ? code
            : [code, encode(meta, `${path}.${name}`) as Readonly<Record<string, unknown>>],
        ];
      }),
    );

  const encode = (value: unknown, path: string): unknown => {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value))
        throw new TypeError(`encodeResource: ${path} is ${String(value)}, which JSON cannot hold`);
      return value;
    }
    if (typeof value === "function") {
      const key = keyOf(value as AnyClass);
      if (key === undefined)
        throw new TypeError(
          `encodeResource: ${path} is the class ${value.name}, which has no action or query key`,
        );
      return key;
    }
    if (Array.isArray(value)) return value.map((item, index) => encode(item, `${path}[${index}]`));
    if (typeof value !== "object" || !isPlain(value))
      throw new TypeError(`encodeResource: ${path} is not JSON data`);
    if ("$$typeof" in value)
      throw new TypeError(`encodeResource: ${path} is an icon element; name the icon instead`);
    // A column, filter, field or entry node (a `kind` and a `key`) holds its enum under `enum`.
    const isNode = "kind" in value && "key" in value;
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        item === undefined
          ? []
          : [
              [
                key,
                isNode && key === "enum" && typeof item === "object" && item !== null
                  ? enumOf(item, `${path}.enum`)
                  : encode(item, `${path}.${key}`),
              ],
            ],
      ),
    );
  };

  return encode(tree, "tree") as ResourceWire;
}
