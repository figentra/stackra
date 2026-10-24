/**
 * Stackra file contract:
 * Purpose: the web `ChatListView` compound on HeroUI Pro's ChatListView: a list of conversations, its root named by
 *          `label` and the parts Item, ItemContent, Icon, Text, Title, Preview and Meta, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatListView.Root` is left out. Imports the `chat-list-view` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatListView as HeroChatListView,
  type ChatListViewRootProps as HeroChatListViewRootProps,
} from "@heroui-pro/react/chat-list-view";

import type { ChatListViewContractProps } from "#contracts/types/chat-list-view-contract-props.type";

/**
 * Props of the web ChatListView: the shared contract plus HeroUI Pro's own list props, passed through. HeroUI Pro's
 * `aria-label` is the contract's `label`, so the type refuses it.
 */
export type ChatListViewProps<T extends object> = ChatListViewContractProps &
  Omit<HeroChatListViewRootProps<T>, keyof ChatListViewContractProps | "aria-label">;

/** The list root: HeroUI Pro's, named for assistive technology by `label`. */
function ChatListViewRoot<T extends object>({ label, ...rest }: ChatListViewProps<T>) {
  return <HeroChatListView.Root<T> {...rest} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatListViewParts {
  /** One conversation row. */
  readonly Item: typeof HeroChatListView.Item;
  /** The row's layout: icon, text and meta. */
  readonly ItemContent: typeof HeroChatListView.ItemContent;
  /** The leading icon. */
  readonly Icon: typeof HeroChatListView.Icon;
  /** The wrapper of the title and the preview. */
  readonly Text: typeof HeroChatListView.Text;
  /** The conversation's title. */
  readonly Title: typeof HeroChatListView.Title;
  /** The last message, as a one-line preview. */
  readonly Preview: typeof HeroChatListView.Preview;
  /** The trailing note, for example when the conversation last changed. */
  readonly Meta: typeof HeroChatListView.Meta;
}

/** A list of recent conversations: `ChatListView.Item` rows of `ItemContent` with `Icon`, `Text` and `Meta`. */
export const ChatListView: typeof ChatListViewRoot & ChatListViewParts = Object.assign(
  ChatListViewRoot,
  {
    Item: HeroChatListView.Item,
    ItemContent: HeroChatListView.ItemContent,
    Icon: HeroChatListView.Icon,
    Text: HeroChatListView.Text,
    Title: HeroChatListView.Title,
    Preview: HeroChatListView.Preview,
    Meta: HeroChatListView.Meta,
  },
);
