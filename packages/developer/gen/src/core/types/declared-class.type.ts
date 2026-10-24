/**
 * Stackra file contract:
 * Purpose: `DeclaredClass`, one class of the member that extends a kind base, as discovery read it from source: its
 *          kind, module, options, partner, constructor tokens, facets, `handle` signature and the refusals its body
 *          raises. Every identity, binding and manifest entry is derived from these records.
 * Boundary: a type only. Options are read from the heritage clause of the member's own source, never from a `.d.ts`
 *           (ADR 0294 decision 25); a class from a dependency is described by that dependency's manifest instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17, 20 and 25); ADR 0305 (rules 5 to 9 and 42).
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** One kind class of the member. */
export interface DeclaredClass {
  /** The class name. */
  readonly name: string;

  /** The kind code its base brands it with (`action`, `service`, `refusal`, ...). */
  readonly kind: string;

  /** The module key that owns it. */
  readonly module: string;

  /** The source file, relative to the member root. */
  readonly file: string;

  /** The specifier generated files import it from. */
  readonly importPath: string;

  /** The constant options of the called base (`Action({ key })`); `{}` for a bare base. */
  readonly options: Readonly<Record<string, unknown>>;

  /** The partner named by the base's type argument (`Policy<Order>`), and the slot of an indexed one. */
  readonly partner?: {
    readonly name: string;
    readonly kind?: string;
    readonly slot?: string;
    readonly from: string;
  };

  /** The class it extends when that is a class, not a kind base: a shape it builds on or the base of an override. */
  readonly base?: ClassRef & { readonly own: boolean };

  /** The constructor tokens, in parameter order. */
  readonly deps: readonly TokenRef[];

  /** The lifetime `@Lifetime(...)` sets; a singleton when absent. */
  readonly lifetime?: string;

  /** Decorators made by `createDecorator` on the class and its members. */
  readonly facets: readonly FacetUse[];

  /** The public instance methods, in source order. */
  readonly methods: readonly string[];

  /** The input and output shape classes of `handle(input): Promise<Output>`. */
  readonly handle?: { readonly input?: string; readonly output?: string };

  /** The refusal codes the class body raises (`XError.create`, `new XError`, `ctx.authorize`). */
  readonly refusals: readonly string[];

  /** Static readonly members and their initializer source (a Permissions class's verbs). */
  readonly statics: Readonly<Record<string, string>>;

  /** The traits of `Model.with(...)`, with their constant arguments. */
  readonly traits: readonly { readonly name: string; readonly args: readonly unknown[] }[];

  /** The identity `@Renamed(old)` records. */
  readonly renamed?: string;
}
