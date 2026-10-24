/**
 * Stackra file contract:
 * Purpose: the page of the ChatTool route: `@stackra/ui-pro`'s ChatTool as a finished tool call (arguments and result), a
 *          call still streaming its arguments, a failed call with its error, and a call that waits for approval with
 *          Approve and Reject buttons whose choice is announced, and ChatToolGroup as a collapsible list of calls.
 * Boundary: presentation only; the calls are local and nothing runs. Each row's trigger is a button that reports its
 *          expanded state; the approval buttons carry visible names.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProChatToolRoute } from "#src/routes/pro-chat-tool/pro-chat-tool.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-tool.*` keys.
const STRINGS = {
  documentTitle: `${ProChatToolRoute.title} · Stackra Playground`,
  intro:
    "Tool calls an assistant makes, one row each: open a row for its arguments and result. A call can be running, failed, or waiting for your approval.",
  states: "States",
  approval: "Approval",
  group: "A group of calls",
  assistant: "Assistant",
  ai: "AI",
  done: "Used tool: ",
  running: "Running tool: ",
  failed: "Failed tool: ",
  needed: "Approval needed: ",
  approve: "Approve",
  reject: "Reject",
  approved: "You approved the call.",
  rejected: "You rejected the call.",
  groupTrigger: "2 tool calls",
} as const;

/** The ChatTool page. */
export function ProChatTool() {
  const [choice, setChoice] = useState<"approved" | "rejected" | null>(null);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatToolRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="states-heading" className="grid max-w-2xl gap-3">
        <h2 id="states-heading" className="type-h2">
          {STRINGS.states}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatTool
              argsText='{"city":"Paris"}'
              defaultExpanded={false}
              output={{ summary: "18 degrees, partly cloudy" }}
              state="output-available"
              toolName="getWeather"
              triggerPrefix={STRINGS.done}
            />
            <UiPro.ChatTool
              defaultExpanded
              argsText='{"query":"chat components'
              state="input-streaming"
              toolName="searchDocs"
              triggerPrefix={STRINGS.running}
            />
            <UiPro.ChatTool
              defaultExpanded
              argsText='{"url":"https://example.com"}'
              errorText="Request timed out after 30 seconds"
              state="output-error"
              toolName="fetchPage"
              triggerPrefix={STRINGS.failed}
            />
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
      <section aria-labelledby="approval-heading" className="grid max-w-2xl gap-3">
        <h2 id="approval-heading" className="type-h2">
          {STRINGS.approval}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatTool
              defaultExpanded
              approveLabel={STRINGS.approve}
              argsText='{"to":"team@example.com","subject":"Launch update"}'
              rejectLabel={STRINGS.reject}
              state="requires-action"
              toolName="sendEmail"
              triggerPrefix={STRINGS.needed}
              onApprove={() => setChoice("approved")}
              onReject={() => setChoice("rejected")}
            />
            <p className="text-sm" role="status">
              {choice === null ? null : STRINGS[choice]}
            </p>
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
      <section aria-labelledby="group-heading" className="grid max-w-2xl gap-3">
        <h2 id="group-heading" className="type-h2">
          {STRINGS.group}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatToolGroup defaultExpanded={false}>
              <UiPro.ChatToolGroup.Trigger>{STRINGS.groupTrigger}</UiPro.ChatToolGroup.Trigger>
              <UiPro.ChatToolGroup.Content>
                {["searchDocs", "fetchPage"].map((toolName) => (
                  <UiPro.ChatTool
                    key={toolName}
                    defaultExpanded={false}
                    state="output-available"
                    toolName={toolName}
                    triggerPrefix={STRINGS.done}
                  />
                ))}
              </UiPro.ChatToolGroup.Content>
            </UiPro.ChatToolGroup>
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
    </article>
  );
}
