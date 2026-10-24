/**
 * Stackra file contract:
 * Purpose: the web `ChatAttachment` compound on HeroUI Pro's ChatAttachment: a file chip with the parts Preview,
 *          Icon, Info, Name, Size and Remove; the remove button is named by `label`, the rest are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's `size` is the
 *          file size in bytes, so it is not the component `size` of the vocabulary and keeps its name. The compound
 *          exposes the documented parts: HeroUI Pro's `ChatAttachment.Root` is left out. Imports the
 *          `chat-attachment` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatAttachment as HeroChatAttachment,
  type ChatAttachmentProps as HeroChatAttachmentProps,
  type ChatAttachmentRemoveProps as HeroChatAttachmentRemoveProps,
} from "@heroui-pro/react/chat-attachment";

import type {
  ChatAttachmentContractProps,
  ChatAttachmentRemoveContractProps,
} from "#contracts/types/chat-attachment-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web ChatAttachment: the shared contract plus HeroUI Pro's own chip props, passed through. */
export type ChatAttachmentProps = ChatAttachmentContractProps &
  Omit<HeroChatAttachmentProps, keyof ChatAttachmentContractProps>;

/** Props of the remove button: the shared contract plus HeroUI Pro's close button props, with `aria-label` as `label`. */
export type ChatAttachmentRemoveProps = ChatAttachmentRemoveContractProps &
  Omit<HeroChatAttachmentRemoveProps, keyof ChatAttachmentRemoveContractProps | "aria-label">;

/** The chip root: HeroUI Pro's, which infers the kind of file from `mimeType` and `name`. */
function ChatAttachmentRoot({ children, ...rest }: ChatAttachmentProps) {
  return <HeroChatAttachment.Root {...rest} {...omitUndefined({ children })} />;
}

/** The remove button: HeroUI Pro's, named by `label`. */
function ChatAttachmentRemove({ label, ...rest }: ChatAttachmentRemoveProps) {
  return <HeroChatAttachment.Remove {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatAttachmentParts {
  /** The thumbnail or the file icon area. */
  readonly Preview: typeof HeroChatAttachment.Preview;
  /** The file icon. */
  readonly Icon: typeof HeroChatAttachment.Icon;
  /** The wrapper of the name and the size. */
  readonly Info: typeof HeroChatAttachment.Info;
  /** The file name. */
  readonly Name: typeof HeroChatAttachment.Name;
  /** The formatted file size, drawn only when the root has one. */
  readonly Size: typeof HeroChatAttachment.Size;
  /** The button that removes the attachment, named by `label`. */
  readonly Remove: typeof ChatAttachmentRemove;
}

/** A file chip: `ChatAttachment.Preview`, `Info` with `Name` and `Size`, and `Remove`. */
export const ChatAttachment: typeof ChatAttachmentRoot & ChatAttachmentParts = Object.assign(
  ChatAttachmentRoot,
  {
    Preview: HeroChatAttachment.Preview,
    Icon: HeroChatAttachment.Icon,
    Info: HeroChatAttachment.Info,
    Name: HeroChatAttachment.Name,
    Size: HeroChatAttachment.Size,
    Remove: ChatAttachmentRemove,
  },
);
