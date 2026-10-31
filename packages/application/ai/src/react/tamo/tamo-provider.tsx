/**
 * Stackra file contract:
 * Purpose: `TamoProvider`, the AI module's side of ADR 0507: it fills @stackra/ui's `TamoContext` with the slot (settings,
 *          client, screen, actions, panel), so every Tamo part in the tree works, and draws the Ask Tamo panel once.
 * Boundary: web; the dependency runs one way (this package uses @stackra/ui, never the reverse). Without it, no Tamo part
 *           draws: the module is not installed.
 * Runtime: browser
 * Governing contract: ADR 0507 (decision 3: the slot is filled by @stackra/ai/react); ADR 0504.
 */
import { TamoContext, TamoPanel } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { TamoProviderProps } from "#react/tamo/tamo-provider.props";
import { useTamoSlot } from "#react/tamo/use-tamo-slot";

/**
 * Tamo for a screen.
 *
 * @example
 * <TamoProvider client={tamoClient} settings={workspace.tamo} screen="orders" screenLabel="Orders">
 *   <OrdersScreen />
 * </TamoProvider>
 */
export function TamoProvider({
  children,
  hasPanel = true,
  ...options
}: TamoProviderProps): ReactElement {
  const slot = useTamoSlot(options);
  return (
    <TamoContext.Provider value={slot}>
      {children}
      {hasPanel ? <TamoPanel /> : null}
    </TamoContext.Provider>
  );
}
