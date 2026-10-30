/**
 * Stackra file contract:
 * Purpose: the "submenu" demo of the web Menu: An action with items opens a second menu to its reading end. It nests
 *          one level; a deeper choice is a second screen.
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

/** The Menu demo: submenu. */
export default function Submenu() {
  const t = useCatalogueText(MESSAGES.en);
  /** A menu with a submenu under Export. */
  const FILE_SECTIONS: readonly MenuSection[] = [
    {
      id: "file",
      title: t(K.sample.file),
      isTitleHidden: true,
      items: [
        {
          id: "export",
          label: t(K.sample.export),
          icon: Icons.Download,
          items: [
            { id: "pdf", label: t(K.sample.as_pdf) },
            { id: "csv", label: t(K.sample.as_csv) },
          ],
        },
        { id: "print", label: t(K.sample.print) },
      ],
    },
  ];
  return (
    <ul className={ROW}>
      <Sample caption={t(K.file_caption)}>
        <UiMenu sections={FILE_SECTIONS}>
          <Button variant="secondary">{t(K.file_trigger)}</Button>
        </UiMenu>
      </Sample>
    </ul>
  );
}
