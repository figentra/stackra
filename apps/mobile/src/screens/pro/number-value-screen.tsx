/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NumberValue` (@stackra/ui-pro): a plain number, currency and
 *          percent styles, a prefix and a suffix around the value, fraction digits, and tabular figures in a column.
 * Boundary: presentation only; the value is @stackra/ui-pro's. Compact, sign and unit formats need the FormatJS
 *          polyfills on some engines, so this page leaves them out.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { NumberValue } from "@stackra/ui-pro/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Plain number",
    description: "With no children the root shows the formatted value.",
  },
  currency: {
    title: "Currency",
    description:
      '`numberStyle="currency"` with a `currency` code; `maximumFractionDigits` trims the decimals.',
  },
  percent: {
    title: "Percent",
    description: "The value is a fraction: 0.033 shows as 3.3%.",
  },
  affixes: {
    title: "Prefix and suffix",
    description:
      "Compose text around the value with `NumberValue.Prefix` and `NumberValue.Suffix`.",
    approx: "about",
    revenue: "revenue",
    users: "active users",
  },
  tabular: {
    title: "Tabular figures",
    description: "Digits take equal width, so a column of amounts lines up.",
  },
} as const;

const AMOUNTS = [228441, 71887, 156540];

/** The NumberValue page: one section per format, in a scrollable screen. */
export function NumberValueScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <NumberValue value={1234.56} classNames={{ value: "text-2xl font-semibold" }} />
      </Section>

      <Section title={STRINGS.currency.title} description={STRINGS.currency.description}>
        <View className="gap-2">
          <NumberValue numberStyle="currency" currency="USD" value={228441} />
          <NumberValue numberStyle="currency" currency="EUR" value={228441} />
          <NumberValue
            numberStyle="currency"
            currency="JPY"
            maximumFractionDigits={0}
            value={228441}
          />
        </View>
      </Section>

      <Section title={STRINGS.percent.title} description={STRINGS.percent.description}>
        <NumberValue numberStyle="percent" maximumFractionDigits={1} value={0.033} />
      </Section>

      <Section title={STRINGS.affixes.title} description={STRINGS.affixes.description}>
        <View className="gap-2">
          <NumberValue value={228441}>
            <NumberValue.Value />
            <NumberValue.Suffix className="ms-1 text-sm text-muted">
              {STRINGS.affixes.revenue}
            </NumberValue.Suffix>
          </NumberValue>
          <NumberValue value={9800}>
            <NumberValue.Prefix className="me-1 text-sm text-muted">
              {STRINGS.affixes.approx}
            </NumberValue.Prefix>
            <NumberValue.Value />
            <NumberValue.Suffix className="ms-1 text-sm text-muted">
              {STRINGS.affixes.users}
            </NumberValue.Suffix>
          </NumberValue>
        </View>
      </Section>

      <Section title={STRINGS.tabular.title} description={STRINGS.tabular.description}>
        <View className="items-end">
          {AMOUNTS.map((amount) => (
            <NumberValue key={amount} numberStyle="currency" currency="USD" value={amount} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
