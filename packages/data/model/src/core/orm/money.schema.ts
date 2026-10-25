/**
 * Stackra file contract:
 * Purpose: `MoneySchema`, the ORM embeddable of `Money` from @stackra/money: two columns per money field, the amount
 *          in minor units (`bigint`) and the ISO 4217 code (`char(3)`). Gen's entity metadata embeds it with the field's
 *          prefix: `{ kind: "embedded", entity: () => MoneySchema, prefix: "total_" }` gives `total_minor` and
 *          `total_currency`.
 * Boundary: declared once here, so no service redeclares it. The amount column refuses a value beyond
 *           `Number.MAX_SAFE_INTEGER` (`MinorUnitsType`). `Money`'s constructor is private and the ORM builds a loaded
 *           value without it, so the class is passed through one cast.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 27: money in a `bigint`, read as a `number`); ADR 0220 (minor units, ISO
 *                     4217); the STA-335 entity-schema spike.
 */
import { EntitySchema } from "@mikro-orm/core";
import type { EntityCtor } from "@mikro-orm/core";
import { Money } from "@stackra/money";

import { MinorUnitsType } from "#core/orm/minor-units.type";

/**
 * The money embeddable.
 *
 * @example
 * total: { kind: "embedded", entity: () => MoneySchema, prefix: "total_" },
 */
export const MoneySchema = new EntitySchema<Money>({
  // reason: the private constructor keeps code on Money.ofMinor; the ORM hydrates without calling it
  class: Money as unknown as EntityCtor<Money>,
  embeddable: true,
  properties: {
    minor: { type: new MinorUnitsType() },
    currency: { type: "string", columnType: "char(3)" },
  },
});
