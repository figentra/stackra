/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/playground: builds the route tree from `src/routes/` inside the playground
 *          shell and mounts it into #root. A stand-in for the entry and route tree gen writes (ADR 0295 decision 7).
 * Boundary: mounting only; pages live in their route folders and are found from them (`playground-pages`). A new
 *          page is a route folder `routes/<name>/` whose path is `/<name>` and nothing else; the navigation, the index
 *          page, the router and the e2e suite all find it by its folder.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12, decision 14); ADR 0302 (decision 5).
 */
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PlaygroundShell } from "#src/components/playground-shell";
import { PLAYGROUND_PAGES, routePath } from "#src/components/playground-pages";
import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";
import { ThemeStudio } from "#src/routes/theme-studio/theme-studio";
import { ThemeStudioRoute } from "#src/routes/theme-studio/theme-studio.route";

// shortcut: authored until stackra gen writes `.stackra/entry/browser.ts` and the route tree (STA-339); then delete
// this file, and index.html with it (gen writes both).
const links = PLAYGROUND_PAGES.map(({ route }) => route);

const router = createBrowserRouter([
  {
    element: <PlaygroundShell pages={links} />,
    children: [
      { path: routePath(HomeRoute), element: <Home pages={links} /> },
      { path: routePath(ThemeStudioRoute), element: <ThemeStudio /> },
      ...PLAYGROUND_PAGES.map(({ route, element }) => ({ path: route.path, element })),
    ],
  },
]);

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <PlaygroundIcons>
      <RouterProvider router={router} />
    </PlaygroundIcons>
  </StrictMode>,
);
