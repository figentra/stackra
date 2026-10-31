/**
 * Stackra file contract:
 * Purpose: `IconSearch`, the icon page's search playground: every icon of the pinned Lucide set, filtered as you type
 *          (by name words), drawn at the system size, each a button that copies its name and says so in a live region.
 * Boundary: the set loads lazily (`@stackra/icons/react/lucide-registry`), so the page entry stays inside its budget;
 *           at most `LIMIT` icons draw at once.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave: icon search playground, 2026-10-28); ADR 0183 (budgets).
 */
import type { IconComponent, LucideIconName } from "@stackra/icons/contracts";
import { Button, Card, Heading, SearchField, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useMemo, useState } from "react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The most icons drawn at once; the count says how many match. */
const LIMIT = 120;

/** The icon search. */
export function IconSearch() {
  const t = useCatalogueText(MESSAGES.en);
  const [icons, setIcons] = useState<Readonly<Record<LucideIconName, IconComponent>>>();
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string>();
  useEffect(() => {
    let isLive = true;
    void import("@stackra/icons/react/lucide-registry").then(({ LUCIDE_REACT_ICONS }) => {
      if (isLive) setIcons(LUCIDE_REACT_ICONS);
    });
    return () => {
      isLive = false;
    };
  }, []);
  const matches = useMemo(() => {
    const words = query
      .toLowerCase()
      .split(/[\s-]+/)
      .filter(Boolean);
    return (Object.keys(icons ?? {}) as LucideIconName[]).filter((name) =>
      words.every((word) => name.includes(word)),
    );
  }, [icons, query]);
  const copy = async (name: string) => {
    await navigator.clipboard.writeText(name);
    setCopied(name);
  };
  return (
    <Card className="grid gap-4 p-6">
      <div className="grid gap-2">
        <Heading level={2}>{t(K.icons_title)}</Heading>
        <Text tone="muted">{t(K.icons_copy_hint)}</Text>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          aria-label={t(K.icons_search)}
          placeholder={t(K.icons_search)}
          value={query}
          onChange={setQuery}
          className="sm:max-w-xs"
        />
        <output aria-live="polite" className="text-sm text-muted">
          {copied ? <bdi dir="ltr">{copied}</bdi> : t(K.icons_count, { count: matches.length })}
        </output>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {matches.slice(0, LIMIT).map((name) => {
          const Glyph = icons?.[name];
          return Glyph ? (
            <li key={name}>
              <Button
                variant="ghost"
                aria-label={name}
                onPress={() => void copy(name)}
                className="h-auto w-full flex-col gap-1 p-2"
              >
                <Glyph aria-hidden size={24} />
                <span
                  aria-hidden
                  dir="ltr"
                  className="w-full truncate text-center font-mono text-(length:--text-3xs) text-muted"
                >
                  {name}
                </span>
              </Button>
            </li>
          ) : null;
        })}
      </ul>
    </Card>
  );
}
