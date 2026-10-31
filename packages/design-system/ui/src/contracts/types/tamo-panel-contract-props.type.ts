/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoPanel` takes: none of its own yet. The panel is the Ask Tamo side panel
 *          (questions about the current screen, answers marked as Tamo's), drawn once by the AI module's provider from
 *          the slot's `panel` state.
 * Boundary: types only; the state is the slot's, so a launcher, the command palette or a field opens it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (the Ask Tamo launcher and side panel); ADR 0490 (page context).
 */

/** Props shared by the web and native `TamoPanel`. */
// A type with no keys: the shared contract both runtimes extend; props land here first.
export type TamoPanelContractProps = Readonly<Record<never, never>>;
