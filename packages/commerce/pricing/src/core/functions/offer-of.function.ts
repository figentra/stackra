/**
 * Stackra file contract:
 * Purpose: `offerOf`, the `CatalogueOffer` an `offer:<name>` version's rows hold: `benefit` rows (`kind` and its
 *          fields) and exactly one `eligibility` row (`packs`, `products`, `ruleSet`, `capPerPack`).
 * Boundary: pure; it reads untrusted admin and seed rows, so an unknown record or benefit kind, a percentage outside
 *           1 to 10,000 basis points, a missing or second eligibility row, or an empty pack or product list is a
 *           `RangeError` naming the row id.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 5); ADR 0393 (decision 2); owner M3-6, R3-SO-18.
 */
import { type CatalogueRow, Enum, type Json } from "@stackra/contracts";

import { BillingPeriod } from "#core/enums/billing-period.enum";
import { OfferBenefitKind } from "#core/enums/offer-benefit-kind.enum";
import { rowText } from "#core/functions/row-text.function";
import { rowWhole } from "#core/functions/row-whole.function";
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";
import type { OfferBenefit } from "#core/types/offer-benefit.type";
import type { OfferEligibility } from "#core/types/offer-eligibility.type";

/** The reader's name in refusals. */
const READER = "offerOf";

/**
 * The offer `key`'s `rows` hold.
 *
 * @throws RangeError for a malformed row or a missing or repeated eligibility row.
 * @example
 * offerOf("offer:startup", (await admin.inForce("offer:startup", termStart))!.rows);
 */
export function offerOf(key: string, rows: readonly CatalogueRow[]): CatalogueOffer {
  const benefits: OfferBenefit[] = [];
  let eligibility: OfferEligibility | undefined;
  for (const row of rows) {
    const record = rowText(READER, row, "record");
    if (record === "eligibility") {
      if (eligibility !== undefined)
        throw new RangeError(`${READER}: row ${String(row.id)} is a second eligibility row`);
      eligibility = eligibilityOf(row);
    } else if (record === "benefit") benefits.push(benefitOf(row));
    else throw new RangeError(`${READER}: row ${String(row.id)} has unknown record ${record}`);
  }
  if (eligibility === undefined) throw new RangeError(`${READER}: ${key} has no eligibility row`);
  return Object.freeze({ key, benefits: Object.freeze(benefits), eligibility });

  /** The benefit one row holds. */
  function benefitOf(row: CatalogueRow): OfferBenefit {
    const kind = rowText(READER, row, "kind");
    const months =
      row.months === null || row.months === undefined ? null : rowWhole(READER, row, "months", 1);
    switch (kind) {
      case OfferBenefitKind.Percent: {
        const basisPoints = rowWhole(READER, row, "basisPoints", 1);
        if (basisPoints > 10_000)
          throw new RangeError(
            `${READER}: row ${String(row.id)} gives more than 10,000 basis points`,
          );
        return Object.freeze({ kind, basisPoints, months });
      }
      case OfferBenefitKind.CreditGrant: {
        const period = rowText(READER, row, "period");
        if (!Enum.values(BillingPeriod).includes(period as BillingPeriod))
          throw new RangeError(`${READER}: row ${String(row.id)} has unknown period ${period}`);
        return Object.freeze({
          kind,
          credit: rowText(READER, row, "credit"),
          units: rowWhole(READER, row, "units", 1),
          period: period as BillingPeriod,
          months,
        });
      }
      case OfferBenefitKind.FreeMigration:
        return Object.freeze({ kind });
      case OfferBenefitKind.ModuleGrant:
        return Object.freeze({ kind, module: rowText(READER, row, "module"), months });
      default:
        throw new RangeError(`${READER}: row ${String(row.id)} has unknown benefit kind ${kind}`);
    }
  }

  /** The eligibility one row holds. */
  function eligibilityOf(row: CatalogueRow): OfferEligibility {
    const list = (field: string): readonly string[] => {
      const value: Json | undefined = row[field];
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.some((item) => typeof item !== "string")
      )
        throw new RangeError(
          `${READER}: row ${String(row.id)} needs a non-empty list of texts in ${field}`,
        );
      return Object.freeze([...(value as string[])]);
    };
    const caps = row.capPerPack ?? {};
    if (typeof caps !== "object" || caps === null || Array.isArray(caps))
      throw new RangeError(`${READER}: row ${String(row.id)} needs a map in capPerPack`);
    return Object.freeze({
      packs: list("packs"),
      products: list("products"),
      ruleSet:
        row.ruleSet === null || row.ruleSet === undefined ? null : rowText(READER, row, "ruleSet"),
      capPerPack: Object.freeze(
        Object.fromEntries(
          Object.entries(caps).map(([pack, cap]) => [
            pack,
            rowWhole(READER, { id: row.id ?? null, cap }, "cap"),
          ]),
        ),
      ),
    });
  }
}
