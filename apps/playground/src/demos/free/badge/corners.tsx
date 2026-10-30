/**
 * Stackra file contract:
 * Purpose: the "corners" demo of the web Badge: The four logical corners, each with a labelled dot.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { BadgePlacement } from "@stackra/ui/contracts";
import { Badge as UiBadge, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BADGE_KEYS } from "#src/demos/free/badge/badge-keys.constant";

/** The demo's keys. */
const K = BADGE_KEYS.badge;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/**
 * A plain disc standing in for an avatar: a neutral fill the dots are measured against. It holds no text, because a
 * badge overlaps the disc's corner and a text there would have an undeterminable background to a contrast check.
 */
function Disc() {
  return <span aria-hidden="true" className="inline-flex size-10 bg-default" />;
}

/** Badge: Corners. */
export default function Corners() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      {BadgePlacement.map((placement) => (
        <li key={placement} className="grid justify-items-center gap-2">
          <UiBadge.Anchor>
            <Disc />
            <UiBadge
              tone="accent"
              size="sm"
              placement={placement}
              label={t(K.corner_label, { placement })}
            />
          </UiBadge.Anchor>
          <Text type="caption" tone="muted">
            <bdi>{placement}</bdi>
          </Text>
        </li>
      ))}
    </ul>
  );
}
