/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/playground: builds the route tree from `src/routes/` inside the playground
 *          shell and mounts it into #root. A stand-in for the entry and route tree gen writes (ADR 0295 decision 7).
 * Boundary: mounting only; pages live in their route folders and are found from them (`playground-pages`). A new
 *          page is a route folder `routes/<name>/` whose path is `/<name>` and a `@stackra/showcase` entry at that
 *          path; the navigation, the index page, the router and the e2e suite all find it by its folder.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12, decision 14); ADR 0302 (decision 5).
 */
import "./styles/app.css";
import "./styles/brand-fonts.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PlaygroundShell } from "#src/components/playground-shell";
import { brandThemeCss, readActiveBrand } from "#src/components/studio-brands";
import { PLAYGROUND_PAGES, routePath } from "#src/components/playground-pages";
import { Components } from "#src/routes/components/components";
import { ComponentsRoute } from "#src/routes/components/components.route";
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
      { path: routePath(HomeRoute), element: <Home /> },
      { path: routePath(ComponentsRoute), element: <Components />, handle: ComponentsRoute.handle },
      {
        path: routePath(ThemeStudioRoute),
        element: <ThemeStudio />,
        handle: ThemeStudioRoute.handle,
      },
      ...PLAYGROUND_PAGES.map(({ route, element }) => ({ path: route.path, element })),
    ],
  },
]);

// The picked brand's layer (Figentra unless the Theme Studio picked another) over the built Stackra stylesheet: the
// same selectors, later in the document, so they win. Set before the first render, so the brand never flashes.
const showcaseCss = document.createElement("style");
showcaseCss.id = "showcase-theme";
showcaseCss.textContent = brandThemeCss(readActiveBrand());
document.head.append(showcaseCss);

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <PlaygroundIcons>
      <RouterProvider router={router} />
    </PlaygroundIcons>
  </StrictMode>,
);
