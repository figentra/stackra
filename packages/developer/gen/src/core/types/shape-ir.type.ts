/**
 * Stackra file contract:
 * Purpose: `ShapeIR`, one shape class as the shape compiler read it: its kind, module, source file and fields, and
 *          the shape it builds on when it extends one.
 * Boundary: a type only. A shape compiles to one `X$` and one `X$Check` in its module's file of `#stackra/schemas`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26, 2026-10-23 item 13: a shape may extend a shape); ADR 0305 (rules 1 and
 *                     14); ADR 0260 (decision 2: a form derives from or extends a consumed shape, STA-1363).
 */
import type { EntityIR } from "#core/types/entity-ir.type";
import type { FieldIR } from "#core/types/field-ir.type";

/** One shape class. */
export interface ShapeIR {
  /** The class name. */
  readonly name: string;

  /** The kind code of its base (`schema`, `config`, `integration_event`, `model`, ...). */
  readonly kind: string;

  /** The module key. */
  readonly module: string;

  /** The source file, relative to the member root. */
  readonly file: string;

  /** The specifier generated files import the class from (`#node/schemas/x.schema`). */
  readonly importPath: string;

  /**
   * What the shape builds on: another shape of the member (compiled first, then `.extend`ed), or a package's shipped
   * `X$`, imported as `Base<Name>$`, for a host override, which only replaces defaults (ADR 0305 rule 1), or a
   * consumed shape of `#stackra/clients/<service>` (`remoteShape`), whose `schema` static is extended, after its
   * `PickType`/`OmitType`/`PartialType` derivation when the shape derives from it (STA-1363). Absent for a shape that
   * extends its kind base directly.
   */
  readonly base?:
    | { readonly kind: "member"; readonly name: string; readonly module: string }
    | { readonly kind: "package"; readonly name: string; readonly from: string }
    | {
        readonly kind: "remote";
        readonly name: string;
        readonly from: string;
        readonly derive?: { readonly helper: string; readonly keys: readonly string[] };
      };

  /** The data fields the shape declares itself (with `base`) or all of them (without). */
  readonly fields: readonly FieldIR[];

  /** Field names left to the entity emitter (model relations). */
  readonly relations: readonly string[];

  /** A model's entity facts: its `[OptionalProps]` keys, relations and getters. Absent for every other kind. */
  readonly entity?: EntityIR;
}
