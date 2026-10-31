/**
 * Stackra file contract:
 * Purpose: `TamoSlot`, the contribution point of @stackra/ui's AI layer: what the AI module puts in `TamoContext` so the
 *          components' Tamo parts work: whether Tamo is on where a part sits, the one task runner, the contributed
 *          actions, the current screen and the Ask Tamo panel's state.
 * Boundary: a type only. @stackra/ui stays AI-free: it draws the parts and calls `run`; @stackra/ai/react fills the slot
 *           (`TamoProvider`), so the dependency runs one way (ADR 0504). With no slot, no Tamo part draws.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits, one-way dependency); ADR 0021 (AI drafts, the person applies).
 */
import type { TamoActionItem } from "#contracts/types/tamo-action-item.type";
import type { TamoScope } from "#contracts/types/tamo-scope.type";
import type { TamoTasks } from "#contracts/types/tamo-tasks.type";

/** What the AI module provides to the design system's Tamo parts. */
export interface TamoSlot {
  /** Whether Tamo is on here: the workspace's, the screen's and the field's settings, a locked level winning. */
  readonly isEnabled: (scope: TamoScope) => boolean;
  /** Runs one task; rejects with an `AbortError` when `signal` aborts (Stop). */
  readonly run: <K extends keyof TamoTasks>(
    task: K,
    input: TamoTasks[K]["input"],
    signal: AbortSignal,
  ) => Promise<TamoTasks[K]["output"]>;
  /** Actions modules add to the text action menu. */
  readonly actions?: readonly TamoActionItem[] | undefined;
  /** The screen the person is on, as the panel names it ("Orders"). */
  readonly screenLabel?: string | undefined;
  /** The Ask Tamo panel: open (with a first question), closed, and the question it was opened with. */
  readonly panel: {
    readonly isOpen: boolean;
    readonly question: string | undefined;
    readonly open: (question?: string) => void;
    readonly close: () => void;
  };
}
