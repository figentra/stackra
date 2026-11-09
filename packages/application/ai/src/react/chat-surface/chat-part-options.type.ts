/**
 * Stackra file contract:
 * Purpose: `ChatPartOptions`, what `renderChatParts` needs besides the parts: the data part renderers, the approval
 *          answer, the tools' labels, the reasoning summary and whether the turn is still being written.
 * Boundary: a type only; the ChatSurface fills it from its own props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0021 (a write waits for a person).
 */
import type { ChatPartRenderers } from "#react/chat-surface/chat-part-renderers.type";

/** The context one turn's parts are drawn in. */
export interface ChatPartOptions {
  /** How each Tamo data part kind is drawn; a kind left out draws nothing. */
  readonly renderers?: ChatPartRenderers | undefined;
  /** Called with a tool call's approval id and the person's answer. */
  readonly onApprovalResponse?: ((approvalId: string, approved: boolean) => void) | undefined;
  /** Each tool name to the label an approval card shows; a tool left out shows its name. */
  readonly toolLabels?: Readonly<Record<string, string>> | undefined;
  /** The reasoning disclosure's summary. */
  readonly reasoningLabel?: string | undefined;
  /** True while the turn is still being written. */
  readonly isWriting: boolean;
}
