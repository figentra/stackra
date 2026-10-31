/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web PricingTable block (@stackra/pricing): three shop plans with a monthly and yearly switch, the middle one featured.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { PricingTable } from "@stackra/pricing/react";
import { Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PRICING_TABLE_KEYS } from "#src/demos/free/pricing-table/pricing-table-keys.constant";

/** The demo's keys. */
const K = PRICING_TABLE_KEYS.pricing_table.basics;

/** An amount in Saudi riyals. */
const sar = (amount: number) => ({ amount, currency: "SAR" });

/** Pricing table: three plans. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState("");
  const periods = [
    { id: "month", label: t(K.monthly), suffix: t(K.per_month) },
    { id: "year", label: t(K.yearly), suffix: t(K.per_year) },
  ];
  const plans = [
    {
      id: "starter",
      name: t(K.starter),
      description: t(K.starter_line),
      prices: { month: sar(99), year: sar(990) },
      features: [t(K.one_shop), t(K.products_500), t(K.cod)],
      cta: t(K.start),
    },
    {
      id: "growth",
      name: t(K.growth),
      description: t(K.growth_line),
      prices: { month: sar(249), year: sar(2490) },
      features: [t(K.three_shops), t(K.unlimited), t(K.reports)],
      cta: t(K.choose),
      badge: t(K.popular),
      isFeatured: true,
    },
    {
      id: "scale",
      name: t(K.scale),
      description: t(K.scale_line),
      prices: { month: sar(599), year: sar(5990) },
      features: [t(K.unlimited), t(K.api), t(K.support)],
      cta: t(K.talk),
    },
  ];
  return (
    <div className="grid w-full gap-4">
      <PricingTable
        plans={plans}
        periods={periods}
        periodLabel={t(K.period)}
        onSelect={(plan, period) =>
          setChosen(
            t(K.chosen, {
              plan: plans.find((item) => item.id === plan)?.name ?? plan,
              period: periods.find((item) => item.id === period)?.label ?? period,
            }),
          )
        }
      />
      <Text tone="muted" type="small" role="status">
        {chosen}
      </Text>
    </div>
  );
}
