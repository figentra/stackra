/**
 * Stackra file contract:
 * Purpose: `SettingType`, the type of one generated setting key: a switch, a whole number, a number, a text, or the
 *          public id of a connection (the one way a setting refers to a credential).
 * Boundary: an `Enum.of` value plus the type of the same name. Gen writes it from the field's TypeScript type; the
 *           form picks its field by it and the reader checks a written value against it. No secret type exists
 *           (ADR 0307 rule 23).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0108 (decision 4).
 */
import { Enum } from "@stackra/contracts";

/**
 * The types of a setting key.
 *
 * @example
 * settingKeys({ orders: { acceptingOrders: { type: SettingType.Boolean, default: true, ... } } });
 */
export const SettingType = Enum.of({
  /** `boolean`: a switch. */
  Boolean: "boolean",
  /** A whole `number` (`@Int`). */
  Integer: "integer",
  /** A finite `number` (`@Num`). */
  Number: "number",
  /** A `string`. */
  String: "string",
  /** A connection's public id (`conn_…`): the setting names the credential, never holds it. */
  Connection: "connection",
});

/** One of the codes above. */
export type SettingType = Enum.Value<typeof SettingType>;
