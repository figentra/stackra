/**
 * Stackra file contract:
 * Purpose: the web `ChatTool` compound on HeroUI Pro's ChatTool: a tool-call row, drawn as a preset from `state`,
 *          `toolName`, `input` and `output` or composed from the parts Trigger, StatusIcon, Content, Args, Result,
 *          Error, Approval, ApprovalActions, Approve, Reject and Meta, HeroUI Pro's own. `isActive` is HeroUI Pro's
 *          `active`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatTool.Root` is left out. HeroUI Pro ships this component on its
 *          `chat-tool` subpath only, so the wrapper imports it from there.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatTool as HeroChatTool,
  type ChatToolProps as HeroChatToolProps,
} from "@heroui-pro/react/chat-tool";

import type { ChatToolContractProps } from "#contracts/types/chat-tool-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web ChatTool: the shared contract plus HeroUI Pro's own, with `active` renamed `isActive`. */
export type ChatToolProps = ChatToolContractProps &
  Omit<HeroChatToolProps, keyof ChatToolContractProps | "active">;

/** The root: HeroUI Pro's disclosure, a preset row from `state` or a composed one from its children. */
function ChatToolRoot({ isActive, ...rest }: ChatToolProps) {
  return <HeroChatTool.Root {...rest} {...omitUndefined({ active: isActive })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatToolParts {
  /** The row that expands and collapses the tool call. */
  readonly Trigger: typeof HeroChatTool.Trigger;
  /** The icon that shows the state of the call. */
  readonly StatusIcon: typeof HeroChatTool.StatusIcon;
  /** The collapsible body. */
  readonly Content: typeof HeroChatTool.Content;
  /** The call's arguments. */
  readonly Args: typeof HeroChatTool.Args;
  /** The call's result. */
  readonly Result: typeof HeroChatTool.Result;
  /** The call's error text. */
  readonly Error: typeof HeroChatTool.Error;
  /** The approval request, drawn while the state requires action. */
  readonly Approval: typeof HeroChatTool.Approval;
  /** The row of approval buttons. */
  readonly ApprovalActions: typeof HeroChatTool.ApprovalActions;
  /** The approve button. */
  readonly Approve: typeof HeroChatTool.Approve;
  /** The reject button. */
  readonly Reject: typeof HeroChatTool.Reject;
  /** The call's identifier. */
  readonly Meta: typeof HeroChatTool.Meta;
}

/** A tool call: a preset from `state`, or `ChatTool.Trigger` with a `Content` of `Args`, `Result` and `Error`. */
export const ChatTool: typeof ChatToolRoot & ChatToolParts = Object.assign(ChatToolRoot, {
  Trigger: HeroChatTool.Trigger,
  StatusIcon: HeroChatTool.StatusIcon,
  Content: HeroChatTool.Content,
  Args: HeroChatTool.Args,
  Result: HeroChatTool.Result,
  Error: HeroChatTool.Error,
  Approval: HeroChatTool.Approval,
  ApprovalActions: HeroChatTool.ApprovalActions,
  Approve: HeroChatTool.Approve,
  Reject: HeroChatTool.Reject,
  Meta: HeroChatTool.Meta,
});

export type { ToolPartState } from "@heroui-pro/react/chat-tool";
