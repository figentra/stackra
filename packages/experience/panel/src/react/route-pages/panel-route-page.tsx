/**
 * Stackra file contract:
 * Purpose: `PanelRoutePage`, the page navigation renders for a panel route (`toPanel(AdminPanel)`, mounted at
 *          `<path>/*`): the panel's shell framing the app's layout and, below it, the panel's own routes: the generic
 *          pages of each registered resource of its area and each registered document whose route names it.
 * Boundary: internal to the `./react` entry; registered by `registerPanelPages`, whose options it reads when it renders.
 *           Reads the class's recorded `path` and `area` through `kindOf`. The routes are descendant routes relative to
 *           the panel's path, so a resource or document whose path lies outside it is not mounted here (it stays on the
 *           app's own route, unframed). With no route matching, the layout draws with no page.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1, rule 20); ADR 0164 (decision 3: several panels); build-list item 53
 *                     (STA-1981).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { ApiArea } from "@stackra/contracts";
import { toResource } from "@stackra/navigation/react";
import { snakeCase } from "@stackra/support";
import type { ReactElement } from "react";
import { useRoutes, type RouteObject } from "react-router";

import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { PanelRef } from "#core/types/panel-ref.type";
import { DocumentPage } from "#react/document-page/document-page";
import { PanelShell } from "#react/panel-shell/panel-shell";
import { PANEL_PAGES } from "#react/route-pages/panel-pages.constant";

/** `path` relative to the panel mounted at `mount` (no trailing slash), or undefined when it lies outside it. */
const below = (mount: string, path: string): string | undefined =>
  mount === "" ? path : path.startsWith(`${mount}/`) ? path.slice(mount.length) : undefined;

/** The routes the panel `ref` mounts below its shell. */
function panelRoutes(ref: PanelRef): RouteObject[] {
  const mount = ref.path.replace(/\/+$/, "");
  const { resources = [], documents = [] } = PANEL_PAGES.current;
  const pages = resources.flatMap((routes) => {
    const base = below(mount, routes.base);
    if (base === undefined || resourceTreeOf(routes.key).options?.area !== ref.area) return [];
    return toResource({ ...routes, base });
  });
  const docs = documents.flatMap(({ route, document }): RouteObject[] => {
    const path = below(mount, route.path);
    if (path === undefined || route.panel.key !== ref.key) return [];
    return [
      {
        path: path.replace(/^\/+/, ""),
        element: <DocumentPage document={document} route={route} />,
      },
    ];
  });
  return [...pages, ...docs];
}

/**
 * The shell of the panel class `panel`, framing its routes.
 *
 * @throws TypeError when `panel` is not a `Panel({ path, area })` class.
 * @example
 * registerRoutePages({ panel: PanelRoutePage });
 */
export function PanelRoutePage({ panel }: { readonly panel: AnyClass }): ReactElement {
  const record = kindOf(panel);
  if (record?.kind !== "panel")
    throw new TypeError(`${panel.name} does not extend Panel({ path, area })`);
  // shortcut: the key comes from the class name (`AdminPanel` is `admin`), not from the file as gen derives it; read
  // gen's panel table instead when it is registered (STA-339).
  const key = snakeCase(panel.name.replace(/Panel$/, ""));
  const ref: PanelRef = {
    key,
    path: record.options["path"] as string,
    area: record.options["area"] as ApiArea,
  };
  const page = useRoutes(panelRoutes(ref));
  const Layout = PANEL_PAGES.current.layout;
  return (
    <PanelShell panel={ref}>{Layout === undefined ? page : <Layout>{page}</Layout>}</PanelShell>
  );
}
