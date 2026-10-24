/**
 * Stackra file contract:
 * Purpose: the web `ChatSource` compound on HeroUI Pro's ChatSource: a citation chip for a URL or a document, with
 *          the parts Trigger, Icon, DocumentIcon, Title and Preview, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's names for the
 *          chip's data (`href`, `title`, `description`, `sourceType`, `enablePreview`) stay as they are. The compound
 *          exposes the documented parts: HeroUI Pro's `ChatSource.Root` is left out. Imports the `chat-source`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatSource as HeroChatSource,
  type ChatSourceProps as HeroChatSourceProps,
} from "@heroui-pro/react/chat-source";

import type { ChatSourceContractProps } from "#contracts/types/chat-source-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web ChatSource: the shared contract plus HeroUI Pro's own chip props, passed through. */
export type ChatSourceProps = ChatSourceContractProps &
  Omit<HeroChatSourceProps, keyof ChatSourceContractProps>;

/** The chip root: HeroUI Pro's, which draws a link or a document chip from its data. */
function ChatSourceRoot({ children, ...rest }: ChatSourceProps) {
  return <HeroChatSource.Root {...rest} {...omitUndefined({ children })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatSourceParts {
  /** The link that holds the icon and the title. */
  readonly Trigger: typeof HeroChatSource.Trigger;
  /** The favicon, or HeroUI Pro's generic link icon. */
  readonly Icon: typeof HeroChatSource.Icon;
  /** The document icon, for a `document` source. */
  readonly DocumentIcon: typeof HeroChatSource.DocumentIcon;
  /** The source's title. */
  readonly Title: typeof HeroChatSource.Title;
  /** The hover card with a preview of the source. */
  readonly Preview: typeof HeroChatSource.Preview;
}

/** A citation chip: `ChatSource.Trigger` with `Icon` and `Title`, and an optional `Preview`. */
export const ChatSource: typeof ChatSourceRoot & ChatSourceParts = Object.assign(ChatSourceRoot, {
  Trigger: HeroChatSource.Trigger,
  Icon: HeroChatSource.Icon,
  DocumentIcon: HeroChatSource.DocumentIcon,
  Title: HeroChatSource.Title,
  Preview: HeroChatSource.Preview,
});
