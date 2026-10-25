/**
 * Stackra file contract:
 * Purpose: `RoutePages`, the pages other packages render for the routes this entry builds without an app page: a
 *          panel's shell (`toPanel`), a resource's list, view, create and update pages (`toResource`), a generated
 *          settings page (`toSettingsPage`) and a document route's document.
 * Boundary: a type only; registered by the package that owns each (`registerRoutePages`), so navigation imports no
 *           panel, settings or experience component.
 * Runtime: browser
 * Governing contract: ADR 0307 (panel v3.1); ADR 0164 (console panels are resources); ADR 0307 (rule 24: settings
 *                     pages); ADR 0110 (documents).
 */
import type { AnyClass } from "@stackra/container";
import type { SettingsPage } from "@stackra/settings";
import type { ComponentType } from "react";

/** The page components other packages contribute. */
export interface RoutePages {
  /** A panel's own shell, mounted at its path. */
  readonly panel: ComponentType<{ readonly panel: AnyClass }>;

  /** One page of a resource. */
  readonly resource: ComponentType<{
    readonly resource: object;
    readonly page: "list" | "view" | "create" | "update";
  }>;

  /** A generated settings page. */
  readonly settings: ComponentType<{ readonly page: SettingsPage }>;

  /** A document route's resolved document. */
  readonly document: ComponentType<{ readonly document: unknown }>;
}
