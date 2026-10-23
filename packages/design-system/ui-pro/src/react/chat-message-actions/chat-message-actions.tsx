/**
 * Stackra file contract:
 * Purpose: the web `ChatMessageActions` compound on HeroUI Pro's ChatMessageActions: the row of preset actions under
 *          a message, with Copy, Regenerate, Menu, ThumbsUp and ThumbsDown named by `label`, and the six preset
 *          icons, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's presets are
 *          icon-only buttons with no accessible name, so `label` is required on each. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatMessageActions.Root` is left out. Imports the `chat-message-actions`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatMessageActions as HeroChatMessageActions,
  type ChatMessageActionPresetProps as HeroChatMessageActionPresetProps,
  type ChatMessageActionsCopyProps as HeroChatMessageActionsCopyProps,
  type ChatMessageActionsProps as HeroChatMessageActionsProps,
} from "@heroui-pro/react/chat-message-actions";

import type {
  ChatMessageActionsContractProps,
  ChatMessageActionsPresetContractProps,
} from "#contracts/types/chat-message-actions-contract-props.type";

/** Props of the web ChatMessageActions: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatMessageActionsProps = ChatMessageActionsContractProps &
  Omit<HeroChatMessageActionsProps, keyof ChatMessageActionsContractProps>;

/** Props of `Regenerate`, `Menu`, `ThumbsUp` and `ThumbsDown`: HeroUI Pro's action props, with `aria-label` as `label`. */
export type ChatMessageActionsPresetProps = ChatMessageActionsPresetContractProps &
  Omit<
    HeroChatMessageActionPresetProps,
    keyof ChatMessageActionsPresetContractProps | "aria-label"
  >;

/** Props of `Copy`: HeroUI Pro's copy action props, with `aria-label` as `label`. */
export type ChatMessageActionsCopyProps = ChatMessageActionsPresetContractProps &
  Omit<HeroChatMessageActionsCopyProps, keyof ChatMessageActionsPresetContractProps | "aria-label">;

/** The row root: HeroUI Pro's. */
function ChatMessageActionsRoot(props: ChatMessageActionsProps) {
  return <HeroChatMessageActions.Root {...props} />;
}

/** The copy action: HeroUI Pro's, which swaps to the copied icon for two seconds, named by `label`. */
function ChatMessageActionsCopy({ label, ...rest }: ChatMessageActionsCopyProps) {
  return <HeroChatMessageActions.Copy {...rest} aria-label={label} />;
}

/** The regenerate action: HeroUI Pro's, named by `label`. */
function ChatMessageActionsRegenerate({ label, ...rest }: ChatMessageActionsPresetProps) {
  return <HeroChatMessageActions.Regenerate {...rest} aria-label={label} />;
}

/** The more-options action: HeroUI Pro's, named by `label`. */
function ChatMessageActionsMenu({ label, ...rest }: ChatMessageActionsPresetProps) {
  return <HeroChatMessageActions.Menu {...rest} aria-label={label} />;
}

/** The thumbs-up action: HeroUI Pro's, named by `label`. */
function ChatMessageActionsThumbsUp({ label, ...rest }: ChatMessageActionsPresetProps) {
  return <HeroChatMessageActions.ThumbsUp {...rest} aria-label={label} />;
}

/** The thumbs-down action: HeroUI Pro's, named by `label`. */
function ChatMessageActionsThumbsDown({ label, ...rest }: ChatMessageActionsPresetProps) {
  return <HeroChatMessageActions.ThumbsDown {...rest} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatMessageActionsParts {
  /** Copies the message; named by `label`. */
  readonly Copy: typeof ChatMessageActionsCopy;
  /** Asks for the reply again; named by `label`. */
  readonly Regenerate: typeof ChatMessageActionsRegenerate;
  /** Opens more options; named by `label`. */
  readonly Menu: typeof ChatMessageActionsMenu;
  /** Rates the reply up; named by `label`. */
  readonly ThumbsUp: typeof ChatMessageActionsThumbsUp;
  /** Rates the reply down; named by `label`. */
  readonly ThumbsDown: typeof ChatMessageActionsThumbsDown;
  /** The copy icon, for a custom action. */
  readonly CopyIcon: typeof HeroChatMessageActions.CopyIcon;
  /** The copied (check) icon, for a custom action. */
  readonly CopiedIcon: typeof HeroChatMessageActions.CopiedIcon;
  /** The regenerate icon, for a custom action. */
  readonly RegenerateIcon: typeof HeroChatMessageActions.RegenerateIcon;
  /** The menu (ellipsis) icon, for a custom action. */
  readonly MenuIcon: typeof HeroChatMessageActions.MenuIcon;
  /** The thumbs-up icon, for a custom action. */
  readonly ThumbsUpIcon: typeof HeroChatMessageActions.ThumbsUpIcon;
  /** The thumbs-down icon, for a custom action. */
  readonly ThumbsDownIcon: typeof HeroChatMessageActions.ThumbsDownIcon;
}

/** The actions under a message: `ChatMessageActions.Copy`, `Regenerate`, `ThumbsUp`, `ThumbsDown` and `Menu`. */
export const ChatMessageActions: typeof ChatMessageActionsRoot & ChatMessageActionsParts =
  Object.assign(ChatMessageActionsRoot, {
    Copy: ChatMessageActionsCopy,
    Regenerate: ChatMessageActionsRegenerate,
    Menu: ChatMessageActionsMenu,
    ThumbsUp: ChatMessageActionsThumbsUp,
    ThumbsDown: ChatMessageActionsThumbsDown,
    CopyIcon: HeroChatMessageActions.CopyIcon,
    CopiedIcon: HeroChatMessageActions.CopiedIcon,
    RegenerateIcon: HeroChatMessageActions.RegenerateIcon,
    MenuIcon: HeroChatMessageActions.MenuIcon,
    ThumbsUpIcon: HeroChatMessageActions.ThumbsUpIcon,
    ThumbsDownIcon: HeroChatMessageActions.ThumbsDownIcon,
  });
