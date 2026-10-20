/**
 * Stackra file contract:
 * Purpose: the route table of @figentra/{{NAME}}, code-based (React Router 7 data routers, no file routing). One
 *          panel shell hosts every page; resource pages are drawn from the registry's @Resource definitions by the
 *          generic panel renderer, so new screens are declared in modules, not added here.
 * Owner: the app owner · Secrets: forbidden
 */
import type { RouteObject } from "react-router";

import { PanelShell } from "./components/panel-shell";

/** Every route of the app; `main.tsx` builds the browser router from it, tests build a memory router. */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <PanelShell title="{{TITLE}}" />,
    children: [
      { index: true, element: <p>No resources registered yet.</p> },
      // shortcut: a placeholder until @stackra/panel renders @Resource pages from the registry (ADR 0126).
      { path: "resources/:resource", element: <p>Resource pages come from @stackra/panel.</p> },
    ],
  },
];
