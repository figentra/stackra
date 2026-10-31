/**
 * Stackra file contract:
 * Purpose: `ChatSurface`, the AI kit's assistant chat block: the conversation in a scroller that sticks to the newest
 *          turn, each answer marked as generated with its reasoning, text, sources and actions, starters while empty, and
 *          the composer.
 * Boundary: composition of @stackra/ui only (ChatMessage, Reasoning, Sources, PromptInput, MessageScroller,
 *           MessageActions, PromptSuggestions, AiMark). It runs no model: the host streams turns from the agent runtime
 *           and passes them in.
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import {
  AiMark,
  ChatMessage,
  MessageActions,
  MessageScroller,
  PromptInput,
  PromptSuggestions,
  Reasoning,
  Sources,
  Text,
} from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ChatSurfaceProps } from "#react/chat-surface/chat-surface.props";

/** No starters. */
const NONE: ChatSurfaceProps["suggestions"] & object = [];

/**
 * The chat: give it a height (it fills its parent and scrolls inside).
 *
 * @example
 * <ChatSurface messages={turns} onSend={send} isStreaming={isStreaming} onStop={stop} labels={labels} />
 */
export function ChatSurface({
  messages,
  onSend,
  onStop,
  isStreaming = false,
  suggestions = NONE,
  onRetry,
  labels,
  className,
}: ChatSurfaceProps): ReactElement {
  const last = messages.at(-1);
  return (
    <div className={`flex h-full min-h-0 flex-col gap-3 ${className ?? ""}`}>
      <MessageScroller label={labels.log} className="min-h-0 flex-1">
        {messages.map((turn) => {
          const isWriting = isStreaming && turn === last && turn.role === "assistant";
          const isAssistant = turn.role === "assistant";
          return (
            <ChatMessage
              key={turn.id}
              from={turn.role}
              authorLabel={isAssistant ? labels.assistant : labels.user}
              isLoading={isWriting && turn.text === ""}
              avatar={
                isAssistant ? <AiMark kind="generated" label={labels.generated} /> : undefined
              }
              actions={
                isAssistant && !isWriting ? (
                  <MessageActions
                    copyValue={turn.text}
                    onRetry={onRetry ? () => onRetry(turn.id) : undefined}
                  />
                ) : undefined
              }
            >
              {turn.reasoning && turn.reasoning.length > 0 && (
                <Reasoning
                  steps={turn.reasoning}
                  summary={labels.reasoning}
                  isStreaming={isWriting}
                />
              )}
              <Text aria-live={isWriting ? "polite" : undefined}>{turn.text}</Text>
              {turn.sources && turn.sources.length > 0 && <Sources sources={turn.sources} />}
            </ChatMessage>
          );
        })}
      </MessageScroller>
      {messages.length === 0 && suggestions.length > 0 && (
        <PromptSuggestions
          suggestions={suggestions}
          onSelect={(suggestion) => onSend(suggestion.prompt ?? suggestion.title)}
        />
      )}
      <PromptInput
        label={labels.prompt}
        placeholder={labels.placeholder}
        footer={labels.disclaimer}
        status={isStreaming ? "streaming" : "ready"}
        onSubmit={onSend}
        onStop={onStop}
      />
    </div>
  );
}
