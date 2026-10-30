/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the web Section: The first action is primary and the next two are secondary. From
 *          the fourth on, actions go in a menu named by the “more actions” label.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import { Section as UiSection, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_KEYS } from "#src/demos/free/section/section-keys.constant";

/** The demo's keys. */
const K = SECTION_KEYS.section;

/** The grid that lays the samples out in one column. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** `count` actions named for what a section does, the first of them creating. */
const actionsOf = (t: ReturnType<typeof useCatalogueText>, count: number): MenuLeafItem[] => {
  const all: MenuLeafItem[] = [
    { id: "create", label: t(K.create), icon: Icons.Plus },
    { id: "edit", label: t(K.edit) },
    { id: "export", label: t(K.export), icon: Icons.Download },
    { id: "duplicate", label: t(K.duplicate), icon: Icons.Copy },
    { id: "print", label: t(K.print) },
    { id: "archive", label: t(K.archive) },
  ];
  return all.slice(0, count);
};

/** The Section demo: actions. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.one)}>
        <UiSection headingLevel={3} title={t(K.one_title)} actions={actionsOf(t, 1)} />
      </Sample>
      <Sample caption={t(K.three)}>
        <UiSection headingLevel={3} title={t(K.three_title)} actions={actionsOf(t, 3)} />
      </Sample>
      <Sample caption={t(K.six)}>
        <UiSection
          headingLevel={3}
          title={t(K.six_title)}
          actions={actionsOf(t, 6)}
          moreActionsLabel={t(K.more_actions)}
        />
      </Sample>
      <Sample caption={t(K.danger)}>
        <UiSection
          headingLevel={3}
          title={t(K.danger_title)}
          actions={[
            { id: "edit", label: t(K.edit) },
            { id: "archive", label: t(K.archive), isDisabled: true },
            { id: "delete", label: t(K.delete), tone: "danger", icon: Icons.Trash },
          ]}
        />
      </Sample>
      <Sample caption={t(K.link)}>
        <UiSection
          headingLevel={3}
          title={t(K.link_title)}
          actions={[{ id: "open", label: t(K.open_app), href: "/page-header" }]}
        />
      </Sample>
    </ul>
  );
}
