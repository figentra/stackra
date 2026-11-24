/**
 * Stackra file contract:
 * Purpose: the panel shell — header, navigation and the outlet every panel page renders into (Filament-style
 *          resources, pages and widgets declared by modules).
 * Boundary: layout only; the pages come from the route folders.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14); ADR 0165 (web client stack); ADR 0305 (rules 10 to 13).
 */
import { Button } from "@heroui/react";
import { Outlet } from "react-router";

import type { PanelShellProps } from "#src/components/panel-shell/panel-shell.props";

/** The shell's words, in one place until @stackra/i18n serves them. */
const STRINGS = {
  account: "Account",
  resources: "Resources",
};

// shortcut: built on @heroui/react directly; @stackra/ui and @stackra/panel exist now, and a product moves onto them
// with its first resource.
/** Layout route of the panel: header and navigation around the current page. */
export function PanelShell({ title }: PanelShellProps) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr]">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <Button size="sm" variant="ghost">
          {STRINGS.account}
        </Button>
      </header>
      <div className="grid grid-cols-[14rem_1fr]">
        <nav aria-label={STRINGS.resources} className="border-e border-border p-4" />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
