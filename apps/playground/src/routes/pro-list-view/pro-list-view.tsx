/**
 * Stackra file contract:
 * Purpose: the page of the ListView route: `@stackra/ui-pro`'s ListView as a list of files with a title, a
 *          description and a named action each, chosen one at a time with the arrow keys or a press and reported
 *          beside it, and an empty list that says so.
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import type { Selection } from "@heroui/react";
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProListViewRoute } from "#src/routes/pro-list-view/pro-list-view.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-list-view.*` keys.
const STRINGS = {
  documentTitle: `${ProListViewRoute.title} · Stackra Playground`,
  intro:
    "A single-column list with keyboard navigation and selection. Move with the arrow keys, press Space or Enter to choose a row, and type to jump to a row.",
  files: "Files",
  list: "Files",
  empty: "Empty list",
  emptyList: "Archived files",
  emptyText: "No archived files.",
  none: "No file is chosen.",
  chosen: (name: string) => `Chosen: ${name}`,
  more: (name: string) => `More actions for ${name}`,
  moreLabel: "More",
  ran: (name: string) => `Opened the actions for ${name}`,
} as const;

const FILES: readonly {
  readonly id: string;
  readonly name: string;
  readonly updated: string;
  readonly icon: DemoIconName;
}[] = [
  { id: "documents", name: "Documents", updated: "Updated 2 days ago", icon: "doc" },
  { id: "photos", name: "Photos", updated: "Updated 1 week ago", icon: "chart" },
  { id: "readme", name: "README.md", updated: "Updated 3 hours ago", icon: "doc" },
  { id: "package", name: "package.json", updated: "Updated yesterday", icon: "gear" },
];

/** The ListView page. */
export function ProListView() {
  const [selected, setSelected] = useState<Selection>(new Set());
  const [action, setAction] = useState<string | null>(null);
  const first = selected === "all" ? undefined : [...selected][0];
  const name = FILES.find((file) => file.id === first)?.name;

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProListViewRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="files-heading" className="grid max-w-md gap-3">
        <h2 id="files-heading" className="type-h2">
          {STRINGS.files}
        </h2>
        <UiPro.ListView
          label={STRINGS.list}
          items={FILES}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {(file) => (
            <UiPro.ListView.Item id={file.id} textValue={file.name}>
              <UiPro.ListView.ItemContent>
                <DemoIcon name={file.icon} />
                <div className="flex min-w-0 flex-col">
                  <UiPro.ListView.Title>{file.name}</UiPro.ListView.Title>
                  <UiPro.ListView.Description>{file.updated}</UiPro.ListView.Description>
                </div>
              </UiPro.ListView.ItemContent>
              <UiPro.ListView.ItemAction>
                <Ui.Button
                  size="sm"
                  variant="ghost"
                  label={STRINGS.more(file.name)}
                  onPress={() => setAction(file.name)}
                >
                  {STRINGS.moreLabel}
                </Ui.Button>
              </UiPro.ListView.ItemAction>
            </UiPro.ListView.Item>
          )}
        </UiPro.ListView>
        <p role="status">
          <bdi>
            {action !== null
              ? STRINGS.ran(action)
              : name === undefined
                ? STRINGS.none
                : STRINGS.chosen(name)}
          </bdi>
        </p>
      </section>
      <section aria-labelledby="empty-heading" className="grid max-w-md gap-3">
        <h2 id="empty-heading" className="type-h2">
          {STRINGS.empty}
        </h2>
        <UiPro.ListView
          label={STRINGS.emptyList}
          items={[]}
          renderEmptyState={() => (
            <p className="p-4 text-center text-sm">
              <bdi>{STRINGS.emptyText}</bdi>
            </p>
          )}
        >
          {(file: { id: string }) => (
            <UiPro.ListView.Item id={file.id} textValue={file.id}>
              <UiPro.ListView.ItemContent>
                <UiPro.ListView.Title>{file.id}</UiPro.ListView.Title>
              </UiPro.ListView.ItemContent>
            </UiPro.ListView.Item>
          )}
        </UiPro.ListView>
      </section>
    </article>
  );
}
