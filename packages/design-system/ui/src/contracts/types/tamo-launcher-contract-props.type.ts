/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoLauncher` takes: the Ask Tamo button and the side panel it opens, which knows the
 *          current screen.
 * Boundary: types only; the panel's state is the slot's, so the command palette and fields can open it with a question. The
 *           shortcut is shown and announced; on web it is bound through the shortcut registry as `ai.ask` (ADR 0508).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0508 (shortcuts).
 */
/** Props shared by the web and native `TamoLauncher`. */
export interface TamoLauncherContractProps {
  /** The launcher's shortcut, as `Mod+J` (Cmd on Apple, Ctrl elsewhere); bound on web. Defaults to `Mod+J`. */
  readonly shortcut?: string | undefined;
  /** The launcher's words. Defaults to "Ask Tamo". */
  readonly label?: string | undefined;
  /** True to draw only the mark. */
  readonly isIconOnly?: boolean | undefined;
}
