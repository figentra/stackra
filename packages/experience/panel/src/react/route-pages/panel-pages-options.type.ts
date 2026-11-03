/**
 * Stackra file contract:
 * Purpose: `PanelPagesOptions`, what `registerPanelPages(options)` takes: the resources' route constants and the
 *          documents a panel route mounts below its shell, and the app's layout drawn around them.
 * Boundary: a type only. Gen passes `resourceList` and the documents of `#stackra/resources`; the app passes its layout
 *           (sidebar, top bar), which draws `children` where the page goes.
 * Runtime: browser
 * Governing contract: ADR 0164 (panel shell); ADR 0307 (rule 20); build-list item 53 (STA-1981).
 */
import type { ComponentType, ReactNode } from "react";

import type { PanelDocumentPage } from "#core/types/panel-document-page.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** What the panel routes mount. */
export interface PanelPagesOptions {
  /** Every resource's route constants (`resourceList`); each panel mounts those of its area. */
  readonly resources?: readonly ResourceRoutes[] | undefined;

  /** Every panel document; each panel mounts those whose route names it. */
  readonly documents?: readonly PanelDocumentPage[] | undefined;

  /** The app's layout inside the shell, around the page. */
  readonly layout?: ComponentType<{ readonly children?: ReactNode }> | undefined;
}
