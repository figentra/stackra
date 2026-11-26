/**
 * Stackra file contract:
 * Purpose: `renderChatParts`, one turn's AI SDK UI message parts drawn in order: text, reasoning (a run of parts is one
 *          disclosure, one step per part), sources (a run is one list), a tool call that waits for a person or was
 *          answered as an ApprovalCard, a failed tool call as a muted line, and each `data-tamo-<kind>` part through
 *          the host's renderer for its kind, else `defaultChatPartRenderers`. Every other part draws nothing.
 * Boundary: pure: it reads each part defensively (the parts arrive from the wire), so an unknown or malformed part
 *           draws nothing and never throws. It answers no approval itself: the host's `onApprovalResponse` does.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0021 (a write waits for a person).
 */
import type { ApprovalCardField, ReasoningStep, SourceItem } from "@stackra/ui/contracts";
import { ApprovalCard, Reasoning, Sources, Text } from "@stackra/ui/react";
import type { UIDataTypes, UIMessagePart, UITools } from "ai";
import { Fragment, type ReactNode } from "react";

import type { TamoPartKind } from "#contracts/enums/tamo-part-kind.enum";
import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";
import type { ChatPartRenderers } from "#react/chat-surface/chat-part-renderers.type";
import { defaultChatPartRenderers } from "#react/chat-surface/default-chat-part-renderers.constant";

/** A part renderer as called here, after the kind is read off the wire. */
type LooseRenderer = (data: unknown, part: unknown, options: ChatPartOptions) => ReactNode;

/** The registry's own renderer for `kind`, so a kind named like an Object member (`constructor`) has none. */
const rendererIn = (renderers: ChatPartRenderers, kind: string): LooseRenderer | undefined =>
  Object.hasOwn(renderers, kind)
    ? (renderers[kind as TamoPartKind] as LooseRenderer | undefined)
    : undefined;

/** A part as read off the wire: any field may be missing or of another type. */
type Loose = Readonly<Record<string, unknown>>;

/** The value's fields when it is an object, else undefined. */
const fieldsIn = (value: unknown): Loose | undefined =>
  typeof value === "object" && value !== null ? (value as Loose) : undefined;

/** The part's fields when it is an object with a string `type`, else undefined. */
const read = (part: unknown): Loose | undefined => {
  const fields = fieldsIn(part);
  return typeof fields?.["type"] === "string" ? fields : undefined;
};

/** The value when it is a string, else undefined. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/** The input's top-level text, number and yes or no entries, as an approval card lists them. */
const fieldsOf = (input: unknown): ApprovalCardField[] =>
  typeof input === "object" && input !== null && !Array.isArray(input)
    ? Object.entries(input).flatMap(([label, value]) =>
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? [{ label, value: String(value) }]
          : [],
      )
    : [];

/** A source part as a SourceItem, or undefined when it is not one. */
const sourceOf = (part: Loose): SourceItem | undefined => {
  const key = text(part["sourceId"]);
  if (key === undefined) return undefined;
  if (part["type"] === "source-url")
    return { key, title: text(part["title"]), href: text(part["url"]) };
  if (part["type"] === "source-document") return { key, title: text(part["title"]) };
  return undefined;
};

/** A tool part (`tool-<name>` or `dynamic-tool`) drawn by its state, or null. */
const toolPart = (part: Loose, key: string, options: ChatPartOptions): ReactNode => {
  const type = part["type"] as string;
  const name = type === "dynamic-tool" ? text(part["toolName"]) : type.slice("tool-".length);
  const state = part["state"];
  if (state === "output-error") {
    return (
      <Text key={key} type="small" tone="muted">
        {text(part["errorText"]) ?? ""}
      </Text>
    );
  }
  const approval = fieldsIn(part["approval"]);
  const approvalId = text(approval?.["id"]);
  if (approvalId === undefined) return null;
  const approved = approval?.["approved"];
  // A denied call moves on to `output-denied`; it keeps its denied card. G2 draws the other outputs.
  const status =
    state === "approval-requested"
      ? "requested"
      : state === "output-denied" || (state === "approval-responded" && approved === false)
        ? "denied"
        : state === "approval-responded" && approved === true
          ? "approved"
          : undefined;
  if (status === undefined) return null;
  return (
    <ApprovalCard
      key={key}
      title={
        // own keys only, so a tool named like an Object member (`constructor`) shows its own name
        (name !== undefined &&
        options.toolLabels !== undefined &&
        Object.hasOwn(options.toolLabels, name)
          ? options.toolLabels[name]
          : undefined) ?? name
      }
      fields={fieldsOf(part["input"])}
      status={status}
      reason={text(approval?.["reason"])}
      onApprove={() => options.onApprovalResponse?.(approvalId, true)}
      onDeny={() => options.onApprovalResponse?.(approvalId, false)}
    />
  );
};

/**
 * One turn's parts as React nodes, in order.
 *
 * @example
 * <ChatMessage from="assistant">{renderChatParts(turn.parts, { renderers, isWriting: false })}</ChatMessage>
 */
export function renderChatParts(
  parts: readonly UIMessagePart<UIDataTypes, UITools>[],
  options: ChatPartOptions,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let steps: ReasoningStep[] = [];
  let sources: SourceItem[] = [];
  // A run of reasoning or source parts closes when another kind of part follows it.
  const flush = (key: string) => {
    if (steps.length > 0) {
      nodes.push(
        <Reasoning
          key={`reasoning-${key}`}
          steps={steps}
          summary={options.reasoningLabel}
          isStreaming={options.isWriting}
        />,
      );
      steps = [];
    }
    if (sources.length > 0) {
      nodes.push(<Sources key={`sources-${key}`} sources={sources} />);
      sources = [];
    }
  };
  parts.forEach((raw, index) => {
    const part = read(raw);
    if (part === undefined) return;
    const type = part["type"] as string;
    const key = String(index);
    if (type === "reasoning") {
      if (sources.length > 0) flush(key);
      steps.push({ key, content: text(part["text"]) ?? "" });
      return;
    }
    const source = sourceOf(part);
    if (source !== undefined) {
      if (steps.length > 0) flush(key);
      sources.push(source);
      return;
    }
    flush(key);
    if (type === "text") {
      nodes.push(
        <Text key={key} aria-live={options.isWriting ? "polite" : undefined}>
          {text(part["text"]) ?? ""}
        </Text>,
      );
    } else if (type.startsWith("tool-") || type === "dynamic-tool") {
      nodes.push(toolPart(part, key, options));
    } else if (type.startsWith("data-tamo-")) {
      const kind = type.slice("data-tamo-".length);
      const render =
        rendererIn(options.renderers ?? {}, kind) ?? rendererIn(defaultChatPartRenderers, kind);
      if (render !== undefined)
        nodes.push(<Fragment key={key}>{render(part["data"], raw, options)}</Fragment>);
    }
  });
  flush(String(parts.length));
  return nodes;
}
