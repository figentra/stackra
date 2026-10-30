/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Item card: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { ItemCard, ItemCardGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ITEM_CARD_KEYS } from "#src/demos/free/item-card/item-card-keys.constant";

/** The demo's keys. */
const K = ITEM_CARD_KEYS.item_card.basics;

/** Item card: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <ItemCardGroup title={t(K.title)} description={t(K.footnote)}>
        <ItemCard
          title={t(K.profile)}
          description={t(K.profile_line)}
          icon={Icons.User}
          onPress={() => setOpened(t(K.profile))}
        />
        <ItemCard title={t(K.plan)} icon={Icons.CreditCard} end={t(K.plan_value)} />
        <ItemCard
          title={t(K.security)}
          icon={Icons.Shield}
          onPress={() => setOpened(t(K.security))}
        />
      </ItemCardGroup>
      <Text tone="muted">{opened ? t(K.pressed, { item: opened }) : null}</Text>
    </div>
  );
}
