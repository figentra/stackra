/**
 * Stackra file contract:
 * Purpose: the "elements" demo of the web Input group: An icon before the value, and a button after it that reveals a
 *          password.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (light, dark, RTL).
 */
import { Button, Icon, InputGroup as UiInputGroup, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_KEYS } from "#src/demos/free/input-group/input-group-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_KEYS.input_group;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Input group: Element affixes. */
export default function Elements() {
  const t = useCatalogueText(MESSAGES.en);
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={GRID}>
      <UiInputGroup label={t(K.search_label)} type="text" prefix={<Icon name="search" />} />
      <UiInputGroup
        label={t(K.password_label)}
        type={isRevealed ? "text" : "password"}
        suffix={
          // The visible word is part of the accessible name, as WCAG 2.5.3 asks.
          <Button
            variant="ghost"
            size="sm"
            label={isRevealed ? t(K.hide) : t(K.show)}
            onPress={() => setIsRevealed((revealed) => !revealed)}
          >
            {isRevealed ? t(K.hide_short) : t(K.show_short)}
          </Button>
        }
      />
    </div>
  );
}
