/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Split view: orders beside their detail on a wide screen, one at a time on a phone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { Button, SplitView, Text, useBreakpoint, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_VIEW_KEYS } from "#src/demos/free/split-view/split-view-keys.constant";

/** The demo's keys. */
const K = SPLIT_VIEW_KEYS.split_view;

const ORDERS = ["1042", "1043", "1044"] as const;

/** Split view: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const isPhone = useBreakpoint().sizeClass === "phone";
  const [order, setOrder] = useState<string | undefined>(undefined);
  return (
    <SplitView
      className="h-72 w-full rounded-[var(--radius-container)] border border-border"
      primaryLabel={t(K.orders)}
      secondaryLabel={t(K.details)}
      primaryWidth={220}
      isSecondaryShown={order !== undefined}
      primary={
        <ul className="grid gap-1 p-2">
          {ORDERS.map((number) => (
            <li key={number}>
              <Button
                variant={number === order ? "secondary" : "ghost"}
                isFullWidth
                onPress={() => setOrder(number)}
              >
                {t(K.order, { number })}
              </Button>
            </li>
          ))}
        </ul>
      }
      secondary={
        <div className="grid gap-2 p-4">
          {order === undefined ? (
            <Text tone="muted">{t(K.pick)}</Text>
          ) : (
            <>
              {isPhone ? (
                <Button
                  variant="ghost"
                  startIcon="chevron-left"
                  onPress={() => setOrder(undefined)}
                >
                  {t(K.back)}
                </Button>
              ) : null}
              <Text className="font-semibold">{t(K.order, { number: order })}</Text>
              <Text tone="muted">{t(K.ready)}</Text>
            </>
          )}
        </div>
      }
    />
  );
}
