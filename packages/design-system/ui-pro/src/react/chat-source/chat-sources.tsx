/**
 * Stackra file contract:
 * Purpose: the web `ChatSources` compound on HeroUI Pro's ChatSources: a collapsible list of citation chips, with
 *          the parts Trigger, Content and List, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatSources.Root` is left out. Imports the `chat-source` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { ChatSources as HeroChatSources } from "@heroui-pro/react/chat-source";

import type { ChatSourcesProps } from "#react/chat-source/chat-sources.props";

/** The root: HeroUI Pro's disclosure, which expands to the list of sources. */
function ChatSourcesRoot(props: ChatSourcesProps) {
  return <HeroChatSources.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatSourcesParts {
  /** The button that expands and collapses the list, for example "3 sources". */
  readonly Trigger: typeof HeroChatSources.Trigger;
  /** The collapsible body. */
  readonly Content: typeof HeroChatSources.Content;
  /** The wrapper of the `ChatSource` chips. */
  readonly List: typeof HeroChatSources.List;
}

/** A collapsible list of citations: `ChatSources.Trigger`, then `Content` holding `List` of `ChatSource`. */
export const ChatSources: typeof ChatSourcesRoot & ChatSourcesParts = Object.assign(
  ChatSourcesRoot,
  {
    Trigger: HeroChatSources.Trigger,
    Content: HeroChatSources.Content,
    List: HeroChatSources.List,
  },
);
