/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/panel (the panel shell, the dashboard and its tile, the
 *          action runner, the route pages it gives navigation, the generic resource pages and relation manager, the
 *          plan-catalogue admin, the onboarding checklist and the Cmd+K search palette)
 *          until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The widget body, the KPI view, the panel and resource route
 *           pages, the resource table and the resource form field are internal. The breadcrumb trail is navigation's: `useBreadcrumbs` is re-exported from
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
export { OnboardingChecklist } from "#react/onboarding-checklist/onboarding-checklist";
export type { OnboardingChecklistProps } from "#react/onboarding-checklist/onboarding-checklist.props";
export { CatalogueProposalForm } from "#react/plan-catalogue/catalogue-proposal-form";
export type { CatalogueProposalFormProps } from "#react/plan-catalogue/catalogue-proposal-form.props";
export { CatalogueRowsEditor } from "#react/plan-catalogue/catalogue-rows-editor";
export type { CatalogueRowsEditorProps } from "#react/plan-catalogue/catalogue-rows-editor.props";
export { CatalogueVersions } from "#react/plan-catalogue/catalogue-versions";
export type { CatalogueVersionsProps } from "#react/plan-catalogue/catalogue-versions.props";
export { PlanCatalogueAdmin } from "#react/plan-catalogue/plan-catalogue-admin";
export type { PlanCatalogueAdminProps } from "#react/plan-catalogue/plan-catalogue-admin.props";
export { RelationManager } from "#react/resource-pages/relation-manager";
export type { RelationManagerProps } from "#react/resource-pages/relation-manager.props";
export { ResourceFormPage } from "#react/resource-pages/resource-form-page";
export type { ResourceFormPageProps } from "#react/resource-pages/resource-form-page.props";
export { ResourceListPage } from "#react/resource-pages/resource-list-page";
export type { ResourceListPageProps } from "#react/resource-pages/resource-list-page.props";
export { ResourceViewPage } from "#react/resource-pages/resource-view-page";
export type { ResourceViewPageProps } from "#react/resource-pages/resource-view-page.props";
export { registerPanelPages } from "#react/route-pages/register-panel-pages.function";
export { SearchPalette } from "#react/search-palette/search-palette";
export type { SearchPaletteHit } from "#react/search-palette/search-palette-hit.type";
export type { SearchPaletteProps } from "#react/search-palette/search-palette.props";
export type { SearchPaletteSource } from "#react/search-palette/search-palette-source.type";
export { WidgetTile } from "#react/widget-tile/widget-tile";
export type { WidgetTileProps } from "#react/widget-tile/widget-tile.props";
