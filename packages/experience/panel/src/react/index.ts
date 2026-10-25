/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/panel (the panel shell, the dashboard and its tile, the
 *          action runner, and the route pages it gives navigation) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The widget body, the KPI view and the panel route page are
 *           internal. The breadcrumb trail is navigation's: `useBreadcrumbs` is re-exported from
 *           `@stackra/navigation/react` only because the template imports it from here (STA-344 moves that import).
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0303 (decision 1); the STA-347 stand-in barrel decision.
 */
export { useBreadcrumbs } from "@stackra/navigation/react";
export type { ActionRun } from "#react/action-runner/action-run.type";
export { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
export type { ActionRunner } from "#react/action-runner/action-runner.type";
export { useActionRunner } from "#react/action-runner/use-action-runner";
export { Dashboard } from "#react/dashboard/dashboard";
export type { DashboardProps } from "#react/dashboard/dashboard.props";
export { PanelShell } from "#react/panel-shell/panel-shell";
export type { PanelShellProps } from "#react/panel-shell/panel-shell.props";
export { usePanel } from "#react/panel-shell/use-panel";
export { registerPanelPages } from "#react/route-pages/register-panel-pages.function";
export { WidgetTile } from "#react/widget-tile/widget-tile";
export type { WidgetTileProps } from "#react/widget-tile/widget-tile.props";
