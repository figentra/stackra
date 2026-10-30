/**
 * Stackra file contract:
 * Purpose: `MirrorOrders`, the mirror hero's card: an orders list built from real @stackra/ui components (Button,
 *          SearchField, Avatar, StatusBadge) in one language, its words from that locale's catalogue and its amounts
 *          formatted in it, so the Arabic card reads right to left with Arabic digits and nothing written for it.
 * Boundary: rendered under `ShowcaseI18n` for `locale` and a `dir`/`lang` wrapper (the hero's); presentation only.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept C); ADR 0060 (RTL); ADR 0080.
 */
import { useMoney } from "@stackra/i18n/react";
import { Avatar, Button, SearchField, StatusBadge, useCatalogueText } from "@stackra/ui/react";
import { motion } from "motion/react";

import { BRAND_KEYS } from "#src/constants/brand-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

import { MIRROR_ORDERS } from "./mirror-orders.constant";
import type { MirrorOrdersProps } from "./mirror-orders.props";

/** The mirror hero's keys. */
const K = BRAND_KEYS.brand.hero.mirror;

/** The tone of each status. */
const TONES = { paid: "success", pending: "warning", shipped: "default" } as const;

/** The orders card in one language. */
export function MirrorOrders({ locale, isStill }: MirrorOrdersProps) {
  const t = useCatalogueText(MESSAGES[locale]);
  const money = useMoney();
  return (
    <div className="grid gap-3.5 hero-panel border border-border bg-surface p-5 text-surface-foreground shadow-[var(--overlay-shadow)] sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="text-lg font-semibold">{t(K.orders)}</span>
        <span className="ms-auto">
          <Button variant="primary" size="sm">
            {t(K.new_order)}
          </Button>
        </span>
      </div>
      <SearchField aria-label={t(K.search)} placeholder={t(K.search)} isFullWidth />
      <ul className="grid">
        {MIRROR_ORDERS.map(({ person, sku, status, cents }, index) => (
          <motion.li
            key={sku}
            className="flex items-center gap-3 border-t border-separator py-3"
            initial={isStill ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.25 + index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Avatar name={t(K[person])} size="sm" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-medium">{t(K[person])}</span>
              <span className="truncate text-sm text-muted">{t(K.order, { sku })}</span>
            </span>
            <StatusBadge tone={TONES[status]} size="sm">
              {t(BRAND_KEYS.brand.hero.status[status])}
            </StatusBadge>
            <span className="min-w-20 text-end text-sm tabular-nums sm:min-w-24">
              {money(cents, "USD")}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
