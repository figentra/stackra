/**
 * Stackra file contract:
 * Purpose: `TypeDesc`, the shape compiler's reading of one field type: what the TypeScript type of a shape field
 *          means as a wire and schema type, read from the declared type node first and the checker second.
 * Boundary: a type only; the analyser produces it and the zod and JSON Schema emitters consume it. A type the grammar
 *           does not allow never becomes a `TypeDesc`: the analyser reports a `shape_*` error instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26: the TypeScript type is the rule); the STA-335 type-to-schema spike;
 *                     ADR 0162 (decision 2: `Translated` per-locale values); ADR 0222 (decision 2: `Upload<Bucket>`
 *                     tokens).
 */

/** The meaning of one shape field type. */
export type TypeDesc =
  | { readonly kind: "string" }
  | { readonly kind: "number" }
  | { readonly kind: "boolean" }
  /** `Date`: ISO 8601 with an offset on the wire. */
  | { readonly kind: "date" }
  /** `Money`: `{ minor, currency }` on the wire. */
  | { readonly kind: "money" }
  /** `Json`: any JSON value. */
  | { readonly kind: "json" }
  /** `Duration`: a canonical ISO 8601 duration. */
  | { readonly kind: "duration" }
  /**
   * A per-locale text: `@stackra/model`'s `Translated` (`value`) or `@stackra/validation`'s structural
   * `TranslatedStrings` (`strings`). Both are a locale-tag-to-text map on the wire; `@Str` rules apply to each text.
   */
  | { readonly kind: "translated"; readonly form: "value" | "strings" }
  /** `Upload<Bucket>` (`@stackra/media`): an upload token `{ id: "upl_…" }`; `bucket` is the bucket class, if named. */
  | { readonly kind: "upload"; readonly bucket?: string }
  /** A branded string: `Url`, `Email` or `CurrencyCode`. */
  | { readonly kind: "brand"; readonly brand: "url" | "email" | "currency_code" }
  /**
   * `PublicId<"ord">` (`prefix`); `PublicId<"crl" | "prl">` (`prefixes`, `prefix` empty); a bare `PublicId`, a
   * polymorphic reference with any registered prefix (`prefix` empty, no `prefixes`).
   */
  | {
      readonly kind: "public_id";
      readonly prefix: string;
      readonly prefixes?: readonly string[];
    }
  /** An `Enum.of` type: its codes in source order, and the module that declares it when it is the member's own. */
  | {
      readonly kind: "enum";
      readonly name: string;
      readonly values: readonly string[];
      readonly module?: string;
    }
  /** `DriverName<Port>`: the driver names registered for the port, sorted. */
  | { readonly kind: "driver_name"; readonly port: string; readonly values: readonly string[] }
  /** Another shape class of the member, by module and class name. */
  | { readonly kind: "schema"; readonly name: string; readonly module: string }
  | { readonly kind: "array"; readonly element: TypeDesc }
  /** `Record<string, T>`. */
  | { readonly kind: "record"; readonly value: TypeDesc }
  /** A union of shape classes, discriminated by one enum-case field. */
  | {
      readonly kind: "union";
      readonly discriminator: string;
      readonly members: readonly { readonly name: string; readonly module: string }[];
    }
  /** The `@Field(zod)` escape hatch: the zod source as written. */
  | { readonly kind: "hatch"; readonly source: string };
