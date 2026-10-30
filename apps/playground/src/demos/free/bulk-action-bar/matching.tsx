/**
 * Stackra file contract:
 * Purpose: the "matching" demo of the web Bulk action bar: When every record on screen is selected and the server
 *          says how many match, the bar offers all of them. Choosing it makes the total the count, and the same
 *          button goes back to the rows shown.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139; ADR 0060 (light, dark, RTL); WCAG 2.2 SC
 *          2.4.3, 4.1.3.
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import type { BulkActionBarProps } from "@stackra/ui/react";
import { BulkActionBar as UiBulkActionBar, Heading, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BULK_ACTION_BAR_KEYS } from "#src/demos/free/bulk-action-bar/bulk-action-bar-keys.constant";

/** The demo's keys. */
const K = BULK_ACTION_BAR_KEYS.bulk_action_bar;

/** Does nothing: a sample whose selection never changes. */
const ignore = () => undefined;

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

/** A bar of the static samples, named after the sample. */
function Static({ name, ...props }: { readonly name: string } & Partial<BulkActionBarProps>) {
  const t = useCatalogueText(MESSAGES.en);
  const THREE: readonly ResourceAction[] = [
    { id: "archive", label: t(K.archive), onPress: ignore },
    { id: "export", label: t(K.export), onPress: ignore },
    { id: "delete", label: t(K.delete), tone: "danger", onPress: ignore },
  ];
  return (
    <UiBulkActionBar
      selectedCount={3}
      actions={THREE}
      onClearSelection={ignore}
      label={t(K.bar_label, { name })}
      {...props}
    />
  );
}

/** The select-all-matching sample: the page keeps the flag, as a table's page does. */
function MatchingExample() {
  const t = useCatalogueText(MESSAGES.en);
  const [isAll, setIsAll] = useState(false);
  return (
    <Static
      name={t(K.matching)}
      selectedCount={20}
      isPageSelected
      totalCount={245}
      isAllMatchingSelected={isAll}
      onAllMatchingSelectedChange={setIsAll}
    />
  );
}

/** Bulk action bar: Select all matching. */
export default function Matching() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Sample title={t(K.offered)}>
        <MatchingExample />
      </Sample>
      <Sample title={t(K.chosen)}>
        <Static
          name={t(K.chosen)}
          selectedCount={20}
          isPageSelected
          totalCount={245}
          isAllMatchingSelected
          onAllMatchingSelectedChange={ignore}
        />
      </Sample>
    </div>
  );
}
