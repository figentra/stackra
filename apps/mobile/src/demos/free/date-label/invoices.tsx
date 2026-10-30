/**
 * Stackra file contract:
 * Purpose: the "invoices" demo of the native DateLabel: open invoices with their numbers kept in order by `Bidi`,
 *          their customers, amounts in the locale's currency format and due-date labels.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Bidi, DateLabel, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_DEMO_KEYS } from "#src/demos/free/date-label/date-label-demo-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_DEMO_KEYS.demo_free.date_label.invoices;

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

/** Open invoices and when each is due. */
export default function Invoices() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" });
  return (
    <View className="gap-3">
      {INVOICES.map((invoice) => (
        <View key={invoice.id} className="gap-1 border-b border-separator pb-3">
          <Text className="font-medium">
            {t(K.invoice)} <Bidi dir="ltr">{invoice.id}</Bidi>
          </Text>
          <Text tone="muted">
            <Bidi>{invoice.customer}</Bidi>
          </Text>
          <View className="flex-row items-center justify-between gap-3">
            <Text>{money.format(invoice.amount)}</Text>
            <DateLabel kind="due" date={dayFromToday(invoice.due)} />
          </View>
        </View>
      ))}
    </View>
  );
}
