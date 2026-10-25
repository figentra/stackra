/**
 * Stackra file contract:
 * Purpose: the page of the FileTree route: `@stackra-pro/ui`'s FileTree as a project tree with nested folders
 *          expanded to start, expanding and collapsing with the arrow keys or a press, and a selection that is
 *          reported beside it, and a second tree that does not animate.
 * Boundary: presentation and local state only. The tree is read-only: it does not move files.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import type { Selection } from "@heroui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProFileTreeRoute } from "#src/routes/pro-file-tree/pro-file-tree.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-file-tree.*` keys.
const STRINGS = {
  documentTitle: `${ProFileTreeRoute.title} · Stackra Playground`,
  intro:
    "A hierarchical file explorer. Press a folder, or use the right and left arrow keys, to expand and collapse it; the up and down arrow keys move, and Enter selects.",
  project: "Project",
  tree: "Project structure",
  reduced: "Without motion",
  reducedTree: "Project structure without motion",
  none: "No file is selected.",
  selected: (id: string) => `Selected: ${id}`,
} as const;

/** A tree of the project's folders and files, drawn by one component for both trees. */
function Items() {
  return (
    <>
      <UiPro.FileTree.Item id="apps" textValue="apps" title="apps">
        <UiPro.FileTree.Item id="console" textValue="console" title="console">
          <UiPro.FileTree.Item id="console-package" textValue="package.json" title="package.json" />
          <UiPro.FileTree.Item id="console-src" textValue="src" title="src">
            <UiPro.FileTree.Item id="console-main" textValue="main.ts" title="main.ts" />
            <UiPro.FileTree.Item id="console-routes" textValue="routes" title="routes" />
          </UiPro.FileTree.Item>
        </UiPro.FileTree.Item>
        <UiPro.FileTree.Item id="docs" textValue="docs" title="docs">
          <UiPro.FileTree.Item id="docs-json" textValue="docs.json" title="docs.json" />
        </UiPro.FileTree.Item>
      </UiPro.FileTree.Item>
      <UiPro.FileTree.Item id="packages" textValue="packages" title="packages">
        <UiPro.FileTree.Item id="tokens" textValue="tokens" title="tokens">
          <UiPro.FileTree.Item id="tokens-src" textValue="src" title="src" />
        </UiPro.FileTree.Item>
      </UiPro.FileTree.Item>
      <UiPro.FileTree.Item id="readme" textValue="README.md" title="README.md" />
      <UiPro.FileTree.Item id="root-package" textValue="package.json" title="package.json" />
    </>
  );
}

/** The FileTree page. */
export function ProFileTree() {
  const [selected, setSelected] = useState<Selection>(new Set());
  const first = selected === "all" ? undefined : [...selected][0];

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProFileTreeRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="project-heading" className="grid gap-3">
        <h2 id="project-heading" className="type-h2">
          {STRINGS.project}
        </h2>
        <UiPro.FileTree
          label={STRINGS.tree}
          className="max-h-[420px] w-80"
          defaultExpandedKeys={["apps", "console", "console-src"]}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={setSelected}
        >
          {Items()}
        </UiPro.FileTree>
        <p role="status">
          <bdi>{first === undefined ? STRINGS.none : STRINGS.selected(String(first))}</bdi>
        </p>
      </section>
      <section aria-labelledby="reduced-heading" className="grid gap-3">
        <h2 id="reduced-heading" className="type-h2">
          {STRINGS.reduced}
        </h2>
        <UiPro.FileTree
          label={STRINGS.reducedTree}
          isMotionReduced
          className="max-h-[420px] w-80"
          defaultExpandedKeys={["packages"]}
        >
          {Items()}
        </UiPro.FileTree>
      </section>
    </article>
  );
}
