/**
 * Stackra file contract:
 * Purpose: the "invoices" demo of the web DateLabel: a back-office list of open invoices, each with its number kept in
 *          order by `Bidi`, its customer, its amount in the locale's currency format and its due-date label.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Bidi, DateLabel, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_KEYS } from "#src/demos/free/date-label/date-label-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_KEYS.date_label;

/** A day `offset` days from today. */
const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/** The open invoices (data, never translated). */
const INVOICES = [
  { id: "INV-2026-0412", customer: "مؤسسة النخيل للتجارة", amount: 4850, due: -5 },
  { id: "INV-2026-0419", customer: "Gulf Fresh Foods", amount: 1275.5, due: 1 },
  { id: "INV-2026-0423", customer: "مقهى الرمال", amount: 960, due: 21 },
] as const;

/** DateLabel: Invoices. */
export default function Invoices() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" });
  return (
    <ul aria-label={t(K.invoices)} className="grid max-w-lg divide-y divide-separator">
      {INVOICES.map((invoice) => (
        <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="grid">
            <Text className="font-medium">
              {t(K.invoice)} <Bidi dir="ltr">{invoice.id}</Bidi>
            </Text>
            <Text tone="muted">
              <Bidi>{invoice.customer}</Bidi>
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Text>{money.format(invoice.amount)}</Text>
            <DateLabel kind="due" date={dayFromToday(invoice.due)} />
          </div>
        </li>
      ))}
    </ul>
  );
}
