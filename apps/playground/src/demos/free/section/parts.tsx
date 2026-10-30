/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Section: Only the title is required. The description, the start slot, the body
 *          and the actions are optional.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import {
  Avatar,
  PropertyList,
  Section as UiSection,
  StatusBadge,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
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

/** Section: Parts. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);

  /** The rows of the "every part" body. */
  const DETAILS = [
    { id: "email", label: t(K.email), value: t(K.email_value) },
    { id: "phone", label: t(K.phone), value: t(K.phone_value) },
    { id: "items", label: t(K.items), value: 3 },
  ] as const;
  return (
    <ul className={GRID}>
      <Sample caption={t(K.title_only)}>
        <UiSection headingLevel={3} title={t(K.title_only_title)} />
      </Sample>
      <Sample caption={t(K.description)}>
        <UiSection
          headingLevel={3}
          title={t(K.description_title)}
          description={t(K.description_line)}
        />
      </Sample>
      <Sample caption={t(K.body)}>
        <UiSection headingLevel={3} title={t(K.body_title)}>
          <Text>{t(K.paid)}</Text>
        </UiSection>
      </Sample>
      <Sample caption={t(K.start)}>
        <UiSection
          headingLevel={3}
          title={t(K.start_title)}
          startContent={<Avatar name={t(K.placed_by)} shape="square" />}
        />
      </Sample>
      <Sample caption={t(K.every)}>
        <UiSection
          headingLevel={3}
          title={t(K.every_title)}
          description={t(K.every_line)}
          startContent={<Avatar name={t(K.placed_by)} shape="square" />}
          actions={actionsOf(t, 2)}
          endContent={<StatusBadge tone="success">{t(K.paid)}</StatusBadge>}
        >
          <PropertyList items={DETAILS} />
        </UiSection>
      </Sample>
    </ul>
  );
}
