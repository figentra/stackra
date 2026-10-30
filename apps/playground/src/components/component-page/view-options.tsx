/**
 * Stackra file contract:
 * Purpose: `ViewOptions`, HeroUI's page actions: Copy Markdown, Copy import and Open HeroUI docs, in an ActionMenu;
 *          a copy reports "Copied" in a live region.
 * Boundary: the menu only; the markdown is `toMarkdown`'s, built by the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 1).
 */
import { importLine } from "@stackra/showcase";
import { ActionMenu, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { ViewOptionsProps } from "#src/components/component-page/view-options.props";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.ui;

/** The page's view options. */
export function ViewOptions({ entry, platform, markdown }: ViewOptionsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [isCopied, setCopied] = useState(false);
  const docsUrl = entry.hero[platform]?.docsUrl;
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };
  return (
    <div className="flex items-center gap-2">
      <output aria-live="polite" className="text-xs text-muted">
        {isCopied ? t(K.copied) : ""}
      </output>
      <ActionMenu
        label={t(K.view_options)}
        icon={Icons.ChevronDown}
        sections={[
          {
            id: "view",
            title: t(K.view_options),
            isTitleHidden: true,
            items: [
              { id: "markdown", label: t(K.copy_markdown), icon: Icons.Copy },
              { id: "import", label: t(K.copy_import), icon: Icons.Copy },
              ...(docsUrl
                ? [
                    {
                      id: "docs",
                      label: t(K.open_hero_docs),
                      icon: Icons.ArrowUpRight,
                      href: docsUrl,
                    },
                  ]
                : []),
            ],
          },
        ]}
        onAction={(id) => {
          if (id === "markdown") void markdown().then(copy);
          if (id === "import") void copy(importLine(entry, platform));
        }}
      />
    </div>
  );
}
