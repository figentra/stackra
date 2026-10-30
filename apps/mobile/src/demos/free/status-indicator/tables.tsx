/**
 * Stackra file contract:
 * Purpose: the "tables" demo of the native StatusIndicator: a dining-room table list where each table's state reads by
 *          shape as well as colour; the table waiting too long pulses.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 30.
 */
import { Separator, StatusIndicator, Text, useCatalogueText } from "@stackra/ui/native";
import { Fragment } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_DEMO_KEYS } from "#src/demos/free/status-indicator/status-indicator-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_DEMO_KEYS.demo_free.status_indicator;

/** The tables: number, state and tone. */
const TABLES = [
  { n: 1, state: K.free, tone: "success", isAttention: false },
  { n: 2, state: K.seated, tone: "accent", isAttention: false },
  { n: 3, state: K.bill, tone: "warning", isAttention: false },
  { n: 4, state: K.overdue, tone: "danger", isAttention: true },
  { n: 5, state: K.cleaning, tone: "default", isAttention: false },
] as const;

/** One row per table. */
export default function Tables() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {TABLES.map((table, index) => (
        <Fragment key={table.n}>
          {index > 0 ? <Separator /> : null}
          <View className="flex-row items-center justify-between">
            <Text>{t(K.table, { n: table.n })}</Text>
            <StatusIndicator tone={table.tone} isAttention={table.isAttention} size="sm">
              {t(table.state)}
            </StatusIndicator>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
