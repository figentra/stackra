/**
 * Stackra file contract:
 * Purpose: `DocsLinks`, the links row under the description: HeroUI docs, Source, React Aria (react), Figma and the
 *          Stackra contract, each an external link; a link whose URL the registry lacks is left out.
 * Boundary: URLs are registry data except the contract's (`contractUrl`); nothing else is derived here.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 (row 2) and 6.
 */
import { Chip, Link, useCatalogueText } from "@stackra/ui/react";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import { contractUrl } from "#src/components/component-page/contract-url.function";
import type { SectionProps } from "#src/components/component-page/section.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.link;

/** The external links of an entry on `platform`. */
export function DocsLinks({ entry, platform }: SectionProps) {
  const t = useCatalogueText(MESSAGES.en);
  const hero = entry.hero[platform];
  const links = [
    { key: K.hero_docs, href: hero?.docsUrl },
    { key: K.source, href: hero?.sourceUrl },
    { key: K.react_aria, href: platform === "react" ? hero?.racUrl : undefined },
    { key: K.figma, href: hero?.figmaUrl },
    { key: K.contract, href: contractUrl(entry) },
  ].filter((link): link is { key: typeof link.key; href: string } => Boolean(link.href));
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.key}>
          <Link href={link.href} isExternal underline="hover" className="hover:no-underline">
            <Chip variant="soft">{t(link.key)}</Chip>
          </Link>
        </li>
      ))}
    </ul>
  );
}
