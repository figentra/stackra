/**
 * Stackra file contract:
 * Purpose: the page of the ActionBar route: `@stackra/ui-pro`'s ActionBar over a list of files that can be selected,
 *          appearing at the foot of the window once one or more files are chosen with a count, three named actions
 *          and a button that clears the selection, and a line that says which action ran last.
 * Boundary: presentation and local state only. HeroUI Pro fixes the bar to the window's foot, so it is closed until
 *          a file is chosen, and the page leaves room under the list for it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import type { Selection } from "@heroui/react";
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProActionBarRoute } from "#src/routes/pro-action-bar/pro-action-bar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-action-bar.*` keys.
const STRINGS = {
  documentTitle: `${ProActionBarRoute.title} · Stackra Playground`,
  intro:
    "A floating toolbar for the actions that apply to a selection. Choose one or more files and the bar appears; clear the selection and it goes away.",
  files: "Files",
  list: "Files",
  bar: "Actions for the selected files",
  count: (count: number) => `${count} selected`,
  edit: "Edit",
  export: "Export",
  archive: "Archive",
  clear: "Clear selection",
  none: "No action has run yet.",
  last: (label: string, count: number) => `Last action: ${label} on ${count} file(s)`,
} as const;

const FILES = [
  { id: "proposal", label: "Project proposal.pdf" },
  { id: "report", label: "Q4 financial report.xlsx" },
  { id: "brand", label: "Brand guidelines.fig" },
  { id: "photo", label: "Team photo.jpg" },
  { id: "notes", label: "Meeting notes.md" },
] as const;

const ACTIONS = [STRINGS.edit, STRINGS.export, STRINGS.archive] as const;

/** The ActionBar page. */
export function ProActionBar() {
  const [selected, setSelected] = useState<Selection>(new Set());
  const [last, setLast] = useState<string | null>(null);
  const count = selected === "all" ? FILES.length : selected.size;

  return (
    <article className="grid gap-6 pb-24">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProActionBarRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="files-heading" className="grid max-w-lg gap-3">
        <h2 id="files-heading" className="type-h2">
          {STRINGS.files}
        </h2>
        <UiPro.ListView
          label={STRINGS.list}
          items={FILES}
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          variant="primary"
        >
          {(file) => (
            <UiPro.ListView.Item id={file.id} textValue={file.label}>
              <UiPro.ListView.ItemContent>
                <UiPro.ListView.Title>{file.label}</UiPro.ListView.Title>
              </UiPro.ListView.ItemContent>
            </UiPro.ListView.Item>
          )}
        </UiPro.ListView>
        <p role="status">
          <bdi>{last === null ? STRINGS.none : STRINGS.last(last, count)}</bdi>
        </p>
      </section>
      <UiPro.ActionBar label={STRINGS.bar} isOpen={count > 0}>
        <UiPro.ActionBar.Prefix>
          <Ui.Chip className="shrink-0 tabular-nums" size="sm">
            {STRINGS.count(count)}
          </Ui.Chip>
        </UiPro.ActionBar.Prefix>
        <UiPro.ActionBar.Content>
          {ACTIONS.map((action) => (
            <Ui.Button key={action} size="sm" variant="ghost" onPress={() => setLast(action)}>
              {action}
            </Ui.Button>
          ))}
        </UiPro.ActionBar.Content>
        <UiPro.ActionBar.Suffix>
          <Ui.Button size="sm" variant="ghost" onPress={() => setSelected(new Set())}>
            {STRINGS.clear}
          </Ui.Button>
        </UiPro.ActionBar.Suffix>
      </UiPro.ActionBar>
    </article>
  );
}
