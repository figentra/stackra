/**
 * Stackra file contract:
 * Purpose: browser entry of @figentra/{{NAME}}: builds the route tree from `src/routes/` inside the panel shell and
 *          mounts it into #root. A stand-in for the entry and route tree gen writes (ADR 0295 decision 7).
 * Boundary: mounting only; pages live in their route folders.
 * Runtime: browser
 * Governing contract: ADR 0295 (decision 7); ADR 0294 (rule R12, decision 14).
 */
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { PanelShell } from "#src/components/panel-shell";
import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";

// shortcut: authored until stackra gen writes `.stackra/entry/browser.ts` and the route tree (STA-339); then delete
// this file, and index.html with it (gen writes both).
const router = createBrowserRouter([
  {
    element: <PanelShell title="{{TITLE}}" />,
    children: [{ path: HomeRoute.path, element: <Home /> }],
  },
]);

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
