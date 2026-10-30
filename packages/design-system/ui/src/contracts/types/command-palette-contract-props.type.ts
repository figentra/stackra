/**
 * Stackra file contract:
 * Purpose: `CommandPaletteContractProps`, the props of every runtime's `CommandPalette`: a search-first dialog of
 *          commands, opened with Cmd+K or Ctrl+K on web and by the app on native.
 * Boundary: types only. Matching ignores case and Arabic diacritics and reads labels, descriptions and keywords.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371.
 */
import type { CommandSection } from "#contracts/types/command-section.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `CommandPalette`. */
export interface CommandPaletteContractProps extends OpenStateContractProps {
  /** The groups of commands to offer, in order. */
  readonly sections: readonly CommandSection[];
  /** Called with the id of the command chosen; the palette then closes. */
  readonly onAction: (id: string) => void;
  /** The search field's hint; "Search commands" by default. */
  readonly placeholder?: string | undefined;
  /** The key that opens it with Cmd or Ctrl (web); `k` by default, `false` for none. */
  readonly hotkey?: string | false | undefined;
}
