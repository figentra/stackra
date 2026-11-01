/**
 * Stackra file contract:
 * Purpose: `TamoProviderProps`, what a host hands `TamoProvider`: the client, the workspace's settings, the current screen and
 *          page context, and the actions modules contribute.
 * Boundary: an interface in its own file beside the component (ADR 0305).
 * Runtime: browser
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoActionItem } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

import type { PageContext } from "#core/schemas/page-context.schema";
import type { TamoClient } from "#react/tamo/tamo-client.type";
import type { TamoSettings } from "#react/tamo/tamo-settings.type";

/** The Tamo provider's props. */
export interface TamoProviderProps {
  /** Runs the tasks: the host's AI service client, or `createMockTamoClient()` offline. */
  readonly client: TamoClient;
  /** The workspace's switch by screen and field (dashboard data). Defaults to on everywhere. */
  readonly settings?: TamoSettings | undefined;
  /** The current screen's key, for the settings and the tasks. */
  readonly screen?: string | undefined;
  /** The current screen's name, as the panel shows it ("Orders"). */
  readonly screenLabel?: string | undefined;
  /** The page the person is on (ADR 0490), sent with each task. */
  readonly page?: PageContext | undefined;
  /** Actions modules add to the text action menu; the client answers them by id. */
  readonly actions?: readonly TamoActionItem[] | undefined;
  /** False to leave out the Ask Tamo panel (a host that draws its own). Defaults to true. */
  readonly hasPanel?: boolean | undefined;
  /** The app the provider wraps, which can then use Tamo's slots. */
  readonly children: ReactNode;
}
