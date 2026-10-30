/**
 * Stackra file contract:
 * Purpose: the "summary" demo of the web Number value: a month's revenue, orders, growth and export size.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import {
  BytesValue,
  MoneyValue,
  NumberValue,
  PercentValue,
  useCatalogueText,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_VALUE_KEYS } from "#src/demos/free/number-value/number-value-keys.constant";

/** The demo's keys. */
const K = NUMBER_VALUE_KEYS.number_value.summary;

/** Number value: a month's revenue, orders, growth and export size. */
export default function Summary() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <dl className="m-0 grid w-full max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
      <dt className="text-muted">{t(K.revenue)}</dt>
      <dd className="m-0 font-medium">
        <MoneyValue amount={1_284_500.75} currency="SAR" />
      </dd>
      <dt className="text-muted">{t(K.orders)}</dt>
      <dd className="m-0 font-medium">
        <NumberValue value={18_342} />
      </dd>
      <dt className="text-muted">{t(K.growth)}</dt>
      <dd className="m-0 font-medium">
        <PercentValue value={0.124} fractionDigits={1} showSign />
      </dd>
      <dt className="text-muted">{t(K.export)}</dt>
      <dd className="m-0 font-medium">
        <BytesValue value={48_200_000} />
      </dd>
    </dl>
  );
}
