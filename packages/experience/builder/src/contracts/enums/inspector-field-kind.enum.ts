/**
 * Stackra file contract:
 * Purpose: `InspectorFieldKind`, the kinds of block prop the inspector can edit: text, number, boolean, enum, money and
 *          localized text.
 * Boundary: an enum in the leaf entry; the discriminant of `InspectorField`. A prop of any other shape (a list, a
 *           nested object) has no kind and is not offered by the inspector.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the block inspector); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kinds of inspector field.
 *
 * @example
 * if (field.kind === InspectorFieldKind.Money) return <MoneyInput value={value} onChange={set} />;
 */
export const InspectorFieldKind = Enum.of({
  /** A string. */
  Text: "text",
  /** A number. */
  Number: "number",
  /** A true or false. */
  Boolean: "boolean",
  /** One of a fixed list of strings. */
  Enum: "enum",
  /** An amount in minor units with its currency (`{ minor, currency }`). */
  Money: "money",
  /** A string per locale (`{ "en-US": "...", ar: "..." }`). */
  Localized: "localized",
});

/** One of the codes above. */
export type InspectorFieldKind = Enum.Value<typeof InspectorFieldKind>;
