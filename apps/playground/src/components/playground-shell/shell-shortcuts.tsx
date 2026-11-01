/**
 * Stackra file contract:
 * Purpose: `ShellShortcuts`, the playground shell's keys on the shortcut registry (ADR 0508): Mod+K and `/` open the
 *          search palette, so the `?` cheat sheet lists them and a person can remap them.
 * Boundary: renders nothing; mounted inside the DesignSystemProvider before the page, so a page's own Mod+K (the
 *           CommandPalette demo) registers later and wins. The palette never opens over a sample's own open dialog
 *           (`when`), and `/` never fires in a text field (the registry's typing guard).
 * Runtime: browser
 * Governing contract: ADR 0508; the showcase redesign spec (2026-10-27).
 */
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { useShortcutActions } from "@stackra/shortcuts/react";

/** Whether no sample has its own modal dialog open. */
const hasNoOpenDialog = () =>
  document.querySelector(
    'dialog[open]:not(.command-palette), [role="dialog"][aria-modal="true"], [role="alertdialog"]',
  ) === null;

/** Registers the shell's search keys. */
export function ShellShortcuts({
  label,
  onSearch,
}: {
  readonly label: string;
  readonly onSearch: () => void;
}): null {
  useShortcutActions([
    {
      id: "playground.search",
      label,
      shortcut: STANDARD_SHORTCUTS["palette.open"],
      scope: "app",
      icon: "search" as const,
      when: hasNoOpenDialog,
      run: onSearch,
    },
    {
      id: "playground.search_slash",
      label,
      shortcut: STANDARD_SHORTCUTS["search.focus"],
      scope: "app",
      when: hasNoOpenDialog,
      run: onSearch,
    },
  ]);
  return null;
}
