/**
 * Stackra file contract:
 * Purpose: `Enum`, the one way to declare a closed set of house values: `Enum.of({...})` plus a type of the same name
 *          (`Enum.Value<typeof X>`), with `Enum.values` in source order and `Enum.meta` for the data of a case.
 * Boundary: a case is a plain code string, so cases compare with `===` and travel as they are on the wire and in a
 *           column. Case data (a tone, a multiplier) is kept beside the object, never on it. The TypeScript `enum`
 *           keyword is banned; this is its replacement.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26), ADR 0231 (snake_case codes), ADR 0127 2026-10-24 note (Enum
 *                     lives in contracts).
 */

const EMPTY_META: Readonly<Record<string, never>> = Object.freeze({});

/** Case data of every enum `Enum.of` built, keyed by the frozen enum object, codes in source order. */
const CASES = new WeakMap<object, ReadonlyMap<string, Readonly<Record<string, unknown>>>>();

/**
 * Builds and reads enums. Never instantiated: an enum is the frozen object `Enum.of` returns.
 *
 * @example
 * export const LoyaltyTier = Enum.of({
 *   Bronze: ["bronze", { tone: Tone.Default, multiplier: 100 }],
 *   Gold: ["gold", { tone: Tone.Warning, multiplier: 200 }],
 * });
 * export type LoyaltyTier = Enum.Value<typeof LoyaltyTier>;
 *
 * Enum.values(LoyaltyTier); // ["bronze", "gold"]
 * Enum.meta(LoyaltyTier, LoyaltyTier.Gold).multiplier; // 200
 */
// oxlint-disable-next-line typescript/no-extraneous-class -- the grammar names `Enum` a base whose statics are its API
export abstract class Enum {
  private constructor() {}

  /**
   * Declares an enum. Each case is a code, or a code and its data. Codes are snake_case house values (a tool-owned
   * value keeps the tool's spelling) and must be unique and non-empty.
   *
   * @throws RangeError when a code is empty or used by two cases.
   */
  static of<const D extends Enum.Definition>(definition: D): Enum.Of<D> {
    const codes: Record<string, string> = {};
    const cases = new Map<string, Readonly<Record<string, unknown>>>();
    for (const [name, value] of Object.entries(definition)) {
      const code = typeof value === "string" ? value : value[0];
      if (code === "") throw new RangeError(`Enum case ${name} has an empty code`);
      if (cases.has(code))
        throw new RangeError(`Enum code "${code}" is used by more than one case`);
      codes[name] = code;
      cases.set(code, typeof value === "string" ? EMPTY_META : Object.freeze({ ...value[1] }));
    }
    const enumeration = Object.freeze(codes);
    CASES.set(enumeration, cases);
    return enumeration as unknown as Enum.Of<D>;
  }

  /**
   * Every code of an enum, in source order, as a new array the caller may keep or change.
   *
   * @throws TypeError when the object was not built by `Enum.of`.
   */
  static values<E extends Enum.Any>(enumeration: E): Enum.Value<E>[] {
    return [...Enum.casesOf(enumeration).keys()] as Enum.Value<E>[];
  }

  /**
   * The data of one case (frozen); `{}` for a case declared without data.
   *
   * @throws RangeError when `code` is not a code of the enum (a value that skipped validation).
   * @throws TypeError when the object was not built by `Enum.of`.
   */
  static meta<E extends Enum.Any, V extends Enum.Value<E>>(enumeration: E, code: V): E["~enum"][V] {
    const meta = Enum.casesOf(enumeration).get(code);
    if (meta === undefined) throw new RangeError(`"${code}" is not a code of this enum`);
    return meta as E["~enum"][V];
  }

  private static casesOf(
    enumeration: object,
  ): ReadonlyMap<string, Readonly<Record<string, unknown>>> {
    const cases = CASES.get(enumeration);
    if (cases === undefined) throw new TypeError("Not an enum: build it with Enum.of({...})");
    return cases;
  }
}

/** The types that go with `Enum`. */
export declare namespace Enum {
  /** One case: its code, or its code and its data. */
  export type Case = string | readonly [code: string, meta: Readonly<Record<string, unknown>>];

  /** What `Enum.of` takes: PascalCase case names to cases. */
  export type Definition = { readonly [name: string]: Case };

  /** The code of one case. */
  export type CodeOf<C> = C extends readonly [infer Code extends string, unknown]
    ? Code
    : C extends string
      ? C
      : never;

  /** The data of one case; `{}` for a bare code. */
  export type MetaOf<C> = C extends readonly [string, infer Meta]
    ? Meta
    : Readonly<Record<string, never>>;

  /**
   * The enum object: each case name to its code, plus a type-only `~enum` map of code to data that `Enum.Value` and
   * `Enum.meta` read. The `~enum` key is never present at runtime.
   */
  export type Of<D extends Definition> = { readonly [Name in keyof D]: CodeOf<D[Name]> } & {
    readonly "~enum": { readonly [Name in keyof D as CodeOf<D[Name]>]: MetaOf<D[Name]> };
  };

  /** Any enum built by `Enum.of`. */
  export type Any = { readonly "~enum": Readonly<Record<string, unknown>> };

  /** One of the codes of an enum: `export type X = Enum.Value<typeof X>`. */
  export type Value<E extends Any> = Extract<keyof E["~enum"], string>;
}
