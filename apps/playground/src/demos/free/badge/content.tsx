/**
 * Stackra file contract:
 * Purpose: the "content" demo of the web Badge: A number, a word and an icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Badge as UiBadge, Icon, useCatalogueText } from "@stackra/ui/react";
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

/** Badge: Content. */
export default function Content() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiBadge.Anchor>
          <Disc />
          <UiBadge tone="accent" label={t(K.number)}>
            {8}
          </UiBadge>
        </UiBadge.Anchor>
      </li>
      <li>
        <UiBadge.Anchor>
          <Disc />
          <UiBadge tone="success" variant="soft" label={t(K.word)}>
            {t(K.sample.new)}
          </UiBadge>
        </UiBadge.Anchor>
      </li>
      <li>
        <UiBadge.Anchor>
          <Disc />
          <UiBadge tone="danger" size="lg" label={t(K.icon_label)}>
            <Icon name="bell" className="size-3" />
          </UiBadge>
        </UiBadge.Anchor>
      </li>
    </ul>
  );
}
