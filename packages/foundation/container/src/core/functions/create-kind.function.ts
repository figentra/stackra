/**
 * Stackra file contract:
 * Purpose: `createKind`, the one helper behind every kind base that has a called form: it turns a base class into a
 *          value usable both as `extends K` and as `extends K({ options })`, keeping `instanceof`, inherited statics
 *          and constructor injection through `super()`.
 * Boundary: writes the kind registry; the kind package casts the result to the kind's declared type, which decides
 *           the forms an author may write (both, or called only). Named without `define`, which is reserved for the
 *           four `stackra.config.ts` functions (ADR 0305 rule 3). Bare-only kinds use `registerKind` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0305 (rules 2, 3 and 43); the STA-335 kind-base spike.
 */
import { registerKind } from "#core/functions/register-kind.function";
import type { AnyClass } from "#core/types/any-class.type";

/** Reads the options of a called form from its arguments. */
type ReadOptions = (...args: never[]) => Readonly<Record<string, unknown>>;

/** The default reader: the one options argument, or `{}`. */
const firstArgument = (options: Readonly<Record<string, unknown>> = {}) => options;

/**
 * Makes `base` a kind base of `kind`. Reached through `super()` (so `new.target` is set) it constructs `base` for
 * the subclass; called as a function it returns a fresh subclass of itself that records the options `read` takes
 * from the arguments. Each call returns its own class.
 *
 * @param kind - the kind code (`"module"`, `"action"`).
 * @param base - the instance base; its prototype becomes the kind's, so `instanceof` holds for both.
 * @param read - turns the call's arguments into the options to record; the first argument by default.
 * @returns the kind base, to be cast to the kind's declared type by the caller.
 * @example
 * export interface Module {
 *   readonly "~kind": "module";
 * }
 * export const Module = createKind("module", class ModuleBase {}) as ModuleClass &
 *   ((options: ModuleOptions) => ModuleClass);
 */
export function createKind(
  kind: string,
  base: AnyClass,
  read: ReadOptions = firstArgument as ReadOptions,
): unknown {
  function KindBase(this: unknown, ...args: unknown[]): unknown {
    if (new.target !== undefined) return Reflect.construct(base, args, new.target);
    const Called = class extends (KindBase as unknown as new (...rest: unknown[]) => object) {};
    registerKind(
      Called,
      kind,
      (read as (...rest: unknown[]) => Readonly<Record<string, unknown>>)(...args),
    );
    return Called;
  }
  Object.setPrototypeOf(KindBase, base); // statics inherit
  KindBase.prototype = base.prototype; // `instanceof KindBase` is `instanceof base`
  Object.defineProperty(KindBase, "name", { value: base.name.replace(/Base$/, "") });
  registerKind(KindBase, kind);
  return KindBase;
}
