/**
 * Stackra file contract:
 * Purpose: the "vertical" demo of the web Separator: Between links in a row; the rule follows the row’s height in
 *          both directions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Link, Separator as UiSeparator, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_KEYS } from "#src/demos/free/separator/separator-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_KEYS.separator;

/** The Separator demo: vertical. */
export default function Vertical() {
  const t = useCatalogueText(MESSAGES.en);
  /** The pages the vertical row links to: the playground's own, so every link works. */
  const RELATED = [
    { href: "/foundations", text: t(K.sample.foundations) },
    { href: "/typography", text: t(K.sample.typography) },
    { href: "/card", text: t(K.sample.card) },
  ] as const;
  return (
    <nav aria-label={t(K.links)}>
      <ul className="flex h-5 items-center gap-4">
        {RELATED.map((link, index) => (
          <li key={link.href} className="flex h-full items-center gap-4">
            {index > 0 ? <UiSeparator orientation="vertical" /> : null}
            <Link href={link.href} underline="hover">
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
