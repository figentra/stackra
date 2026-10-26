/**
 * Stackra file contract:
 * Purpose: the web `ChatToolGroup` compound on HeroUI Pro's ChatToolGroup: a collapsible group of tool calls, with
 *          the parts Trigger and Content, HeroUI Pro's own. `isActive` is HeroUI Pro's `active`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatToolGroup.Root` is left out. Imports the `chat-tool` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { ChatToolGroup as HeroChatToolGroup } from "@heroui-pro/react/chat-tool";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ChatToolGroupProps } from "#react/chat-tool/chat-tool-group.props";

/** The root: HeroUI Pro's disclosure, which shimmers its trigger while `isActive`. */
function ChatToolGroupRoot({ isActive, ...rest }: ChatToolGroupProps) {
  return <HeroChatToolGroup.Root {...rest} {...omitUndefined({ active: isActive })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatToolGroupParts {
  /** The row that expands and collapses the group. */
  readonly Trigger: typeof HeroChatToolGroup.Trigger;
  /** The collapsible body that holds the tool calls. */
  readonly Content: typeof HeroChatToolGroup.Content;
}

/** A group of tool calls: `ChatToolGroup.Trigger`, then `Content` holding `ChatTool` rows. */
export const ChatToolGroup: typeof ChatToolGroupRoot & ChatToolGroupParts = Object.assign(
  ChatToolGroupRoot,
  {
    Trigger: HeroChatToolGroup.Trigger,
    Content: HeroChatToolGroup.Content,
  },
);
