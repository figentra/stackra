/**
 * Stackra file contract:
 * Purpose: the "launcher" demo of the web CommandPalette: go to and create.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, CommandPalette, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMMAND_PALETTE_KEYS } from "#src/demos/free/command-palette/command-palette-keys.constant";

/** The demo's keys. */
const K = COMMAND_PALETTE_KEYS.command_palette;

/** The shortcut drawn on the launcher: a key chord, never translated. */
const STRINGS = { shortcut: "⌘K" } as const;

/** Command palette: open with the button or Cmd+K, type, press Enter. */
export default function Launcher() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const [ran, setRan] = useState("");
  const sections = [
    {
      id: "go",
      title: t(K.go),
      items: [
        {
          id: "orders",
          label: t(K.orders),
          icon: "shopping-bag" as const,
          keywords: t(K.sales_words),
        },
        { id: "customers", label: t(K.customers), icon: "users" as const },
        { id: "reports", label: t(K.reports), icon: "chart-column" as const },
      ],
    },
    {
      id: "create",
      title: t(K.create),
      items: [
        { id: "product", label: t(K.product), icon: "plus" as const, shortcut: "⌘N" },
        { id: "discount", label: t(K.discount), icon: "percent" as const },
      ],
    },
  ];
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        startIcon="search"
        endIcon={<kbd className="text-xs text-muted">{STRINGS.shortcut}</kbd>}
        onPress={() => setOpen(true)}
      >
        {t(K.open)}
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onOpenChange={setOpen}
        sections={sections}
        onAction={(id) => setRan(t(K[id as "orders"]))}
      />
      <p role="status" className="m-0 text-sm text-muted">
        {ran ? t(K.ran, { command: ran }) : ""}
      </p>
    </div>
  );
}
