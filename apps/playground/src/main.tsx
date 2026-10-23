/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/playground: builds the route tree from `src/routes/` inside the playground
 *          shell and mounts it into #root. A stand-in for the entry and route tree gen writes (ADR 0295 decision 7).
 * Boundary: mounting only; pages live in their route folders. A new page is a route folder `routes/<name>/` whose
 *          path is `/<name>`, plus one line in PAGES; the e2e suite finds it by its folder.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12, decision 14); ADR 0302 (decision 5).
 */
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { PlaygroundShell } from "#src/components/playground-shell";
import { Foundations } from "#src/routes/foundations/foundations";
import { FoundationsRoute } from "#src/routes/foundations/foundations.route";
import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";
import { ProActionPalette } from "#src/routes/pro-action-palette/pro-action-palette";
import { ProActionPaletteRoute } from "#src/routes/pro-action-palette/pro-action-palette.route";
import { ProAppLayout } from "#src/routes/pro-app-layout/pro-app-layout";
import { ProAppLayoutRoute } from "#src/routes/pro-app-layout/pro-app-layout.route";
import { ProDataGrid } from "#src/routes/pro-data-grid/pro-data-grid";
import { ProDataGridRoute } from "#src/routes/pro-data-grid/pro-data-grid.route";
import { ProKanban } from "#src/routes/pro-kanban/pro-kanban";
import { ProKanbanRoute } from "#src/routes/pro-kanban/pro-kanban.route";
import { ProKpi } from "#src/routes/pro-kpi/pro-kpi";
import { ProKpiRoute } from "#src/routes/pro-kpi/pro-kpi.route";
import { ProSidebar } from "#src/routes/pro-sidebar/pro-sidebar";
import { ProSidebarRoute } from "#src/routes/pro-sidebar/pro-sidebar.route";
import { ProTrendChip } from "#src/routes/pro-trend-chip/pro-trend-chip";
import { ProTrendChipRoute } from "#src/routes/pro-trend-chip/pro-trend-chip.route";

// shortcut: authored until stackra gen writes `.stackra/entry/browser.ts` and the route tree (STA-339); then delete
// this file, and index.html with it (gen writes both).
/** The component pages, in navigation order: the foundations page first, then the Pro group the shell lists last. */
const PAGES = [
  { route: FoundationsRoute, element: <Foundations /> },
  { route: ProDataGridRoute, element: <ProDataGrid /> },
  { route: ProActionPaletteRoute, element: <ProActionPalette /> },
  { route: ProSidebarRoute, element: <ProSidebar /> },
  { route: ProAppLayoutRoute, element: <ProAppLayout /> },
  { route: ProKanbanRoute, element: <ProKanban /> },
  { route: ProKpiRoute, element: <ProKpi /> },
  { route: ProTrendChipRoute, element: <ProTrendChip /> },
];

const links = PAGES.map(({ route }) => route);

const router = createBrowserRouter([
  {
    element: <PlaygroundShell pages={links} />,
    children: [
      { path: HomeRoute.path, element: <Home pages={links} /> },
      ...PAGES.map(({ route, element }) => ({ path: route.path, element })),
    ],
  },
]);

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
