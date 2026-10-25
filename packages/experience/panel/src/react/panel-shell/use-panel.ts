/**
 * Stackra file contract:
 * Purpose: `usePanel()`, the panel the nearest `PanelShell` frames.
 * Boundary: reads the context; throws outside a shell, because a panel page drawn outside its panel has no area to read.
 * Runtime: browser
 * Governing contract: ADR 0164.
 */
import { use } from "react";

import type { PanelRef } from "#core/types/panel-ref.type";
import { PanelContext } from "#react/panel-shell/panel-context";

/**
 * The current panel.
 *
 * @throws Error outside a `PanelShell`.
 * @example
 * const panel = usePanel(); // Panels.Admin
 */
export function usePanel(): PanelRef {
  const state = use(PanelContext);
  if (state === null) throw new Error("usePanel() needs a PanelShell above it");
  return state.panel;
}
