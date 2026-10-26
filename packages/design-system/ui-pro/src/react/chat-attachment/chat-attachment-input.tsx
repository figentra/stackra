/**
 * Stackra file contract:
 * Purpose: the web `ChatAttachmentInput` compound on HeroUI Pro's ChatAttachmentInput: the file picker that the
 *          Trigger button and the Dropzone share. `isDisabled` is HeroUI Pro's `disabled`, on the root and the
 *          trigger, and the trigger is named by `label`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ChatAttachmentInput.Root` is left out. Imports the `chat-attachment`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatAttachmentInput as HeroChatAttachmentInput,
  type ChatAttachmentInputProps as HeroChatAttachmentInputProps,
  type ChatAttachmentInputTriggerProps as HeroChatAttachmentInputTriggerProps,
} from "@heroui-pro/react/chat-attachment";

import type {
  ChatAttachmentInputContractProps,
  ChatAttachmentInputTriggerContractProps,
} from "#contracts/types/chat-attachment-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#core/hooks/use-ui-pro-text";

/** Props of the web ChatAttachmentInput: the shared contract plus HeroUI Pro's own, with `disabled` as `isDisabled`. */
export type ChatAttachmentInputProps = ChatAttachmentInputContractProps &
  Omit<HeroChatAttachmentInputProps, keyof ChatAttachmentInputContractProps | "disabled">;

/** Props of the attach button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type ChatAttachmentInputTriggerProps = ChatAttachmentInputTriggerContractProps &
  Omit<
    HeroChatAttachmentInputTriggerProps,
    keyof ChatAttachmentInputTriggerContractProps | "aria-label" | "disabled"
  >;

/** The picker root: HeroUI Pro's, which opens the file dialog and takes dropped and pasted files. */
function ChatAttachmentInputRoot({ isDisabled, ...rest }: ChatAttachmentInputProps) {
  return <HeroChatAttachmentInput.Root {...rest} {...omitUndefined({ disabled: isDisabled })} />;
}

/** The attach button: HeroUI Pro's, named by `label` and disabled by `isDisabled`. */
function ChatAttachmentInputTrigger({
  label,
  isDisabled,
  ...rest
}: ChatAttachmentInputTriggerProps) {
  const t = useUiProText();
  return (
    <HeroChatAttachmentInput.Trigger
      {...rest}
      aria-label={label ?? t(UI_PRO_KEYS.ui_pro.chat.attach_files)}
      {...omitUndefined({ disabled: isDisabled })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatAttachmentInputParts {
  /** The button that opens the file dialog, named by `label`. */
  readonly Trigger: typeof ChatAttachmentInputTrigger;
  /** The area that takes dropped and pasted files. */
  readonly Dropzone: typeof HeroChatAttachmentInput.Dropzone;
}

/** The file picker of a composer: `ChatAttachmentInput.Trigger` and `Dropzone` inside the root. */
export const ChatAttachmentInput: typeof ChatAttachmentInputRoot & ChatAttachmentInputParts =
  Object.assign(ChatAttachmentInputRoot, {
    Trigger: ChatAttachmentInputTrigger,
    Dropzone: HeroChatAttachmentInput.Dropzone,
  });
