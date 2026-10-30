/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Separator: Turn the rule between the two blocks.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, Separator as UiSeparator, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_KEYS } from "#src/demos/free/separator/separator-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_KEYS.separator;

/** Separator: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isVertical, setIsVertical] = useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onPress={() => setIsVertical((value) => !value)}>
          {t(K.turn)}
        </Button>
        <Text tone="muted" data-testid="orientation">
          <bdi>{t(K.orientation, { value: isVertical ? "vertical" : "horizontal" })}</bdi>
        </Text>
      </div>
      <div className={isVertical ? "flex items-stretch gap-4" : "grid max-w-xs gap-4"}>
        <Text>{t(K.block_a)}</Text>
        <UiSeparator orientation={isVertical ? "vertical" : "horizontal"} data-testid="live-rule" />
        <Text>{t(K.block_b)}</Text>
      </div>
    </div>
  );
}
