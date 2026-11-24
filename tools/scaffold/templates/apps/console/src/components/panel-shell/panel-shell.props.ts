/**
 * Stackra file contract:
 * Purpose: `PanelShellProps`: props of `PanelShell`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link PanelShell}. */
export interface PanelShellProps {
  /** The panel's name, shown in the header. */
  title: string;
}
