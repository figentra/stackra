/**
 * Stackra file contract:
 * Purpose: the "control" demo of the web Badge: The badge is not labelled: the button’s own name already says the
 *          count, and a press on the badge reaches the button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Badge as UiBadge, Icon, IconButton, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_KEYS } from "#src/demos/free/badge/badge-keys.constant";

/** The demo's keys. */
const K = BADGE_KEYS.badge;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** The count the control sample starts at, which its label names. */
const INITIAL_COUNT = 3;

/** Badge: On a control. */
export default function Control() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(INITIAL_COUNT);

  const [presses, setPresses] = useState(0);

  return (
    <div className={ROW}>
      <UiBadge.Anchor>
        <IconButton
          variant="secondary"
          label={t(K.control_label, { count })}
          icon={<Icon name="bell" />}
          onPress={() => {
            setCount((value) => value + 1);
            setPresses((value) => value + 1);
          }}
        />
        <UiBadge tone="danger" size="sm">
          {count}
        </UiBadge>
      </UiBadge.Anchor>
      <output aria-live="polite" data-testid="press-count">
        <bdi>{t(K.presses, { count: presses })}</bdi>
      </output>
    </div>
  );
}
