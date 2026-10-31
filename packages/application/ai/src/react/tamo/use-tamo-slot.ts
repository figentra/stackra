/**
 * Stackra file contract:
 * Purpose: `useTamoSlot`, the `TamoSlot` the AI module puts in @stackra/ui's `TamoContext`: the on/off answer from the
 *          workspace's settings, the client's runner with the screen and page context added, the contributed actions, and
 *          the Ask Tamo panel's state.
 * Boundary: React state only, no DOM, so a native host can build the slot too and put it in @stackra/ui/native's
 *           `TamoContext`.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (decisions 3 and 5); ADR 0490 (page context).
 */
import type { TamoSlot } from "@stackra/ui/contracts";
import { useMemo, useState } from "react";

import { resolveTamoEnabled } from "#react/tamo/resolve-tamo-enabled.function";
import type { TamoProviderProps } from "#react/tamo/tamo-provider.props";

/** On everywhere: the default once the AI module is installed. */
const ON = { isEnabled: true } as const;

/**
 * The slot for a screen.
 *
 * @example
 * const slot = useTamoSlot({ client, settings, screen: "orders", screenLabel: "Orders" });
 */
export function useTamoSlot({
  client,
  settings = ON,
  screen,
  screenLabel,
  page,
  actions,
}: Omit<TamoProviderProps, "children" | "hasPanel">): TamoSlot {
  const [panel, setPanel] = useState<{
    readonly isOpen: boolean;
    readonly question?: string | undefined;
  }>({
    isOpen: false,
  });
  return useMemo<TamoSlot>(
    () => ({
      isEnabled: (scope) => resolveTamoEnabled(settings, scope.screen ?? screen, scope.field),
      run: (task, input, signal) => client.run(task, input, signal, { screen, page }),
      actions,
      screenLabel,
      panel: {
        isOpen: panel.isOpen,
        question: panel.question,
        open: (question) => setPanel({ isOpen: true, question }),
        close: () => setPanel({ isOpen: false }),
      },
    }),
    [client, settings, screen, screenLabel, page, actions, panel],
  );
}
