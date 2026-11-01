/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web command-palette: the palette's Ask Tamo entry: type a question and it opens the Ask Tamo panel with it (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { Button, CommandPalette, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMMAND_PALETTE_KEYS } from "#src/demos/free/command-palette/command-palette-keys.constant";

/** The demo's keys. */
const K = COMMAND_PALETTE_KEYS.command_palette;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Command palette: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  return (
    <TamoProvider client={CLIENT} screen="dashboard" screenLabel={t(K.tamo_screen)}>
      <Button variant="secondary" startIcon="search" onPress={() => setOpen(true)}>
        {t(K.tamo_open)}
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onOpenChange={setOpen}
        hotkey={false}
        sections={[
          {
            id: "go",
            title: t(K.go),
            items: [
              { id: "orders", label: t(K.orders), icon: Icons.ShoppingBag },
              { id: "customers", label: t(K.customers), icon: Icons.Users },
            ],
          },
        ]}
        onAction={() => undefined}
      />
    </TamoProvider>
  );
}
