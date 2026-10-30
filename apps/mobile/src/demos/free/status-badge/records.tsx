/**
 * Stackra file contract:
 * Purpose: the "records" demo of the native StatusBadge: the status column of a list of records.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Separator, StatusBadge, Text, useCatalogueText } from "@stackra/ui/native";
import { Fragment } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_BADGE_DEMO_KEYS } from "#src/demos/free/status-badge/status-badge-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_BADGE_DEMO_KEYS.demo_free.status_badge;

/** The orders: a number and the tone of its state. */
const ORDERS = [
  { id: "1040", tone: "success" },
  { id: "1041", tone: "warning" },
  { id: "1042", tone: "danger" },
  { id: "1043", tone: "default" },
] as const;

/** One row per order. */
export default function Records() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {ORDERS.map((order, index) => (
        <Fragment key={order.id}>
          {index > 0 ? <Separator /> : null}
          <View className="flex-row items-center justify-between">
            <Text>{t(K.order, { id: order.id })}</Text>
            <StatusBadge tone={order.tone} size="sm">
              {t(K.states[order.tone])}
            </StatusBadge>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
