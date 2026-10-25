/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/panel (the panel shell and its breadcrumbs, the dashboard and
 *          its tile, and the action runner) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The widget body and the KPI view are internal.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { ActionRun } from "#react/action-runner/action-run.type";
export { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
export type { ActionRunner } from "#react/action-runner/action-runner.type";
export { useActionRunner } from "#react/action-runner/use-action-runner";
export type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
export { useBreadcrumb } from "#react/breadcrumbs/use-breadcrumb";
export { useBreadcrumbs } from "#react/breadcrumbs/use-breadcrumbs";
export { Dashboard } from "#react/dashboard/dashboard";
export type { DashboardProps } from "#react/dashboard/dashboard.props";
export { PanelShell } from "#react/panel-shell/panel-shell";
export type { PanelShellProps } from "#react/panel-shell/panel-shell.props";
export { usePanel } from "#react/panel-shell/use-panel";
export { WidgetTile } from "#react/widget-tile/widget-tile";
export type { WidgetTileProps } from "#react/widget-tile/widget-tile.props";
