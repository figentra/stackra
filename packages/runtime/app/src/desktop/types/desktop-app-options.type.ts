/**
 * Stackra file contract:
 * Purpose: `DesktopAppOptions`, what `createApp` from `@stackra/app/desktop` takes: the main-process wiring, the
 *          origins allowed to call bridges and to be navigated to, the renderer bundle, the preload, the dev values
 *          and the update feed.
 * Boundary: a type only; gen writes the values in `.stackra/entry/desktop.ts`. The hardening baseline is not an
 *           option (ADR 0251 decision 3).
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0251; ADR 0249.
 */
import type { Wiring } from "@stackra/container";

import type { AppSections } from "#core/types/app-sections.type";
import type { DesktopDevOptions } from "#desktop/types/desktop-dev-options.type";

/** The options of the desktop `createApp`. */
export interface DesktopAppOptions {
  /** The main-process wiring (`desktop/wiring.ts`): menus, bridges, peripherals and the config main reads. */
  readonly wiring: Wiring & AppSections;

  /** Origin prefixes (`app://bundle/`, the dev origin) whose frames may call a bridge and be navigated to. */
  readonly bridgeSenders: readonly string[];

  /** The built renderer, served as `app://bundle/`. */
  readonly rendererDir: URL;

  /** The generated preload script. */
  readonly preload: URL;

  /** The dev values of an unpackaged run; `null` when packaged. */
  readonly dev: DesktopDevOptions | null;

  /** The update feed URL; `null` when the member has no feed. */
  readonly updateFeed: string | null;
}
