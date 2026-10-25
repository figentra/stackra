/**
 * Stackra file contract:
 * Purpose: `PanelContext`, the React context the panel shell provides: the panel and its breadcrumb trail.
 * Boundary: internal to the `./react` entry; read through `usePanel`, `useBreadcrumbs` and `useBreadcrumb`.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0294 (decision 23: Provider means a React context component).
 */
import { createContext } from "react";

import type { PanelState } from "#react/panel-shell/panel-state.type";

/** The shell's state; `null` outside a `PanelShell`. */
export const PanelContext = createContext<PanelState | null>(null);
