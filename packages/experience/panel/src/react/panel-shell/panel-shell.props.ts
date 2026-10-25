/**
 * Stackra file contract:
 * Purpose: `PanelShellProps`, what `PanelShell` takes: the panel it frames and the app's layout inside it.
 * Boundary: a type only, in its own file beside the component (one declaration per file).
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12: `<name>.props.ts`); ADR 0164.
 */
import type { ReactNode } from "react";

import type { PanelRef } from "#core/types/panel-ref.type";

/** The props of the panel shell. */
export interface PanelShellProps {
  /** The panel the shell frames (`Panels.Admin`). */
  readonly panel: PanelRef;

  /** The app's layout: its sidebar, top bar and outlet. */
  readonly children?: ReactNode;
}
