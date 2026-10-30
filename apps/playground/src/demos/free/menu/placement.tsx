/**
 * Stackra file contract:
 * Purpose: the "placement" demo of the web Menu: The side by reading direction (start and end follow right-to-left)
 *          and the alignment along it. The menu flips when there is no room.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu as UiMenu, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_KEYS } from "#src/demos/free/menu/menu-keys.constant";

/** The demo's keys. */
const K = MENU_KEYS.menu;

/** The sides of the placement samples. */
const SIDES = ["top", "bottom", "start", "end"] as const;

/** The alignments of the placement samples. */
const ALIGNS = ["start", "center", "end"] as const;

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

/** The Menu demo: placement. */
export default function Placement() {
  const t = useCatalogueText(MESSAGES.en);
  /** Two actions, for the placement samples. */
  const TWO_ACTIONS: readonly MenuSection[] = [
    {
      id: "actions",
      title: t(K.sample.actions),
      isTitleHidden: true,
      items: [
        { id: "one", label: t(K.item_one) },
        { id: "two", label: t(K.item_two) },
      ],
    },
  ];
  return (
    <ul className={ROW}>
      {SIDES.map((side) => (
        <Sample key={side} caption={t(K.side_caption, { side })}>
          <UiMenu sections={TWO_ACTIONS} placement={side}>
            <Button variant="tertiary">{t(K.side, { side })}</Button>
          </UiMenu>
        </Sample>
      ))}
      {ALIGNS.map((align) => (
        <Sample key={align} caption={t(K.align_caption, { align })}>
          <UiMenu sections={TWO_ACTIONS} placement="bottom" align={align}>
            <Button variant="tertiary">{t(K.align, { align })}</Button>
          </UiMenu>
        </Sample>
      ))}
    </ul>
  );
}
