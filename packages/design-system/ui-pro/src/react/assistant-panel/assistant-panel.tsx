/**
 * Stackra file contract:
 * Purpose: the web `AssistantPanel`: the sidekick's panel: a header with the assistant's name, its AI label and
 *          actions, the conversation filling the middle and scrolling, and the composer pinned under it.
 * Boundary: layout only; the conversation and composer are the caller's (`ChatConversation`, `PromptInput`). The
 *           panel is a labelled region named by its heading. The AI label uses `@stackra/ui`'s `AiMark`, shown.
 * Runtime: browser
 * Governing contract: ADR 0360 (decisions 1 and 11); ADR 0310 (decision 3).
 */
import { AiMark } from "@stackra/ui/react";
import { useId, type ReactElement } from "react";

import type { AssistantPanelProps } from "#react/assistant-panel/assistant-panel.props";

/** The assistant's panel. */
export function AssistantPanel({
  title,
  disclosure,
  headerActions,
  children,
  composer,
}: AssistantPanelProps): ReactElement {
  const headingId = useId();
  return (
    <section
      data-slot="assistant-panel"
      aria-labelledby={headingId}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center justify-between gap-2 border-b border-separator px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <h2 id={headingId} className="truncate text-sm font-semibold">
            {title}
          </h2>
          {disclosure === undefined ? null : (
            <AiMark kind="generated" label={disclosure} isLabelVisible />
          )}
        </div>
        {headerActions == null ? null : (
          <div className="flex items-center gap-1">{headerActions}</div>
        )}
      </header>
      <div data-slot="assistant-panel-conversation" className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      <footer data-slot="assistant-panel-composer" className="border-t border-separator p-3">
        {composer}
      </footer>
    </section>
  );
}
