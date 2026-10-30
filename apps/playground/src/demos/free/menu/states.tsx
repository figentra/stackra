/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Menu: A link action follows its href. A disabled trigger never opens, and a
 *          disabled action is shown but refused.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu as UiMenu, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_KEYS } from "#src/demos/free/menu/menu-keys.constant";

/** The demo's keys. */
const K = MENU_KEYS.menu;

/** A sample with its caption underneath. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi>{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Menu: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** A plain menu: one group of labels. */
  const PLAIN_SECTIONS: readonly MenuSection[] = [
    {
      id: "sort",
      title: t(K.sample.sort),
      isTitleHidden: true,
      items: [
        { id: "newest", label: t(K.sample.newest_first) },
        { id: "oldest", label: t(K.sample.oldest_first) },
      ],
    },
  ];
  /** A menu whose first action is a link. */
  const LINK_SECTIONS: readonly MenuSection[] = [
    {
      id: "go",
      title: t(K.sample.go),
      isTitleHidden: true,
      items: [
        {
          id: "type",
          label: t(K.sample.typography_page),
          icon: Icons.ExternalLink,
          href: "/typography",
        },
        { id: "stay", label: t(K.sample.stay_here) },
      ],
    },
  ];
  return (
    <ul className={ROW}>
      <Sample caption={t(K.link_caption)}>
        <UiMenu sections={LINK_SECTIONS}>
          <Button variant="secondary">{t(K.link_trigger)}</Button>
        </UiMenu>
      </Sample>
      <Sample caption={t(K.disabled_caption)}>
        <UiMenu sections={PLAIN_SECTIONS}>
          <Button variant="secondary" isDisabled>
            {t(K.disabled_trigger)}
          </Button>
        </UiMenu>
      </Sample>
    </ul>
  );
}
