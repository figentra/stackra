/**
 * Stackra file contract:
 * Purpose: `ChatPartOptions`, what `renderChatParts` needs besides the parts: the data part renderers, the approval
 *          answer, the question answer, the send handler, the tools' labels, the reasoning summary and whether the turn is
 *          still being written. A part renderer gets it too, so a drawn question or suggestion can answer or send.
 * Boundary: a type only; the ChatSurface fills it from its own props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0021 (a write waits for a person).
 */
import type { ChatPartRenderers } from "#react/chat-surface/chat-part-renderers.type";

/** The context one turn's parts are drawn in. */
export interface ChatPartOptions {
  /** How each Tamo data part kind is drawn; a kind left out falls back to `defaultChatPartRenderers`. */
  readonly renderers?: ChatPartRenderers | undefined;
  /** Called with a tool call's approval id and the person's answer. */
  readonly onApprovalResponse?: ((approvalId: string, approved: boolean) => void) | undefined;
  /** Called with a question part's id and the person's answer, keyed by field; left out, a question is read-only. */
  readonly onAnswer?: ((questionId: string, values: Record<string, unknown>) => void) | undefined;
  /**
   * Called with an artifact part's id and version when the person opens it; the host fetches a download link then,
   * since a part never carries one. Left out, the artifact's name is plain text.
   */
  readonly onOpenArtifact?: ((artifactId: string, version: number) => void) | undefined;
  /** As `onOpenArtifact`, for the download button; left out, there is none. */
  readonly onDownloadArtifact?: ((artifactId: string, version: number) => void) | undefined;
  /** Called with the text of a suggestion the person picks; left out, suggestions cannot be picked. */
  readonly onSend?: ((text: string) => void) | undefined;
  /** Each tool name to the label an approval card shows; a tool left out shows its name. */
  readonly toolLabels?: Readonly<Record<string, string>> | undefined;
  /** The reasoning disclosure's summary. */
  readonly reasoningLabel?: string | undefined;
  /** True while the turn is still being written. */
  readonly isWriting: boolean;
}
