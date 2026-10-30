/**
 * Stackra file contract:
 * Purpose: the "icon-context" demo of the web VisuallyHidden: two "Read more" links on a store's help page that a
 *          screen reader tells apart, because each carries its topic out of sight.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Link, Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_KEYS.visually_hidden;

/** The help topics. */
const TOPICS = [K.return_policy, K.delivery_times] as const;

/** VisuallyHidden: Link context. */
export default function IconContext() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid max-w-sm gap-3">
      {TOPICS.map((topic) => (
        <li key={topic} className="flex items-center justify-between gap-4">
          <Text>{t(topic)}</Text>
          <Link href="#">
            {t(K.read_more)}
            <VisuallyHidden>{t(K.about, { topic: t(topic) })}</VisuallyHidden>
          </Link>
        </li>
      ))}
    </ul>
  );
}
