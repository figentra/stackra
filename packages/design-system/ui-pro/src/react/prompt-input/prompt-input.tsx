/**
 * Stackra file contract:
 * Purpose: the web `PromptInput` compound on HeroUI Pro's PromptInput: the message composer, its root taking the
 *          shared `size`, `isDisabled` and `isLoading`, with the parts Shell, Content, Attachments, TextArea,
 *          Toolbar, ToolbarStart, ToolbarEnd, Footer, Send, Action, Queue, Token, TokenInput, TokenSuggestions and
 *          Tokens. TextArea and Send are named by `label`, Action requires it, and Send takes `isLoading`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `isLoading` is HeroUI
 *          Pro's `isPending`, which HeroUI Pro deprecates in favour of `status` and treats as `status="streaming"`;
 *          `status` itself passes through for the finer lifecycle (ready, submitted, streaming, error). The queue
 *          and token parts are HeroUI Pro's own and unchanged. The compound exposes the documented parts: HeroUI
 *          Pro's `PromptInput.Root` is left out. Imports the `prompt-input` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  PromptInput as HeroPromptInput,
  type PromptInputActionProps as HeroPromptInputActionProps,
  type PromptInputProps as HeroPromptInputProps,
  type PromptInputSendProps as HeroPromptInputSendProps,
  type PromptInputTextAreaProps as HeroPromptInputTextAreaProps,
} from "@heroui-pro/react/prompt-input";

import type {
  PromptInputActionContractProps,
  PromptInputContractProps,
  PromptInputSendContractProps,
  PromptInputTextAreaContractProps,
} from "#contracts/types/prompt-input-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web PromptInput: the shared contract plus HeroUI Pro's own, with `isPending` renamed `isLoading`. */
export type PromptInputProps = PromptInputContractProps &
  Omit<HeroPromptInputProps, keyof PromptInputContractProps | "isPending">;

/** Props of the text area: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputTextAreaProps = PromptInputTextAreaContractProps &
  Omit<HeroPromptInputTextAreaProps, keyof PromptInputTextAreaContractProps | "aria-label">;

/** Props of the send button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputSendProps = PromptInputSendContractProps &
  Omit<HeroPromptInputSendProps, keyof PromptInputSendContractProps | "aria-label" | "isPending">;

/** Props of an icon action: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type PromptInputActionProps = PromptInputActionContractProps &
  Omit<HeroPromptInputActionProps, keyof PromptInputActionContractProps | "aria-label">;

/** The composer root: HeroUI Pro's, which owns the value, the submit and stop handlers and the status. */
function PromptInputRoot({ size, isDisabled, isLoading, ...rest }: PromptInputProps) {
  return (
    <HeroPromptInput.Root
      {...rest}
      {...omitUndefined({ size, isDisabled, isPending: isLoading })}
    />
  );
}

/** The auto-growing text area: HeroUI Pro's, named by `label`. */
function PromptInputTextArea({ label, ...rest }: PromptInputTextAreaProps) {
  return <HeroPromptInput.TextArea {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The send button, which becomes stop while a reply is generated: HeroUI Pro's, named by `label`. */
function PromptInputSend({ label, isLoading, ...rest }: PromptInputSendProps) {
  return (
    <HeroPromptInput.Send
      {...rest}
      {...omitUndefined({ "aria-label": label, isPending: isLoading })}
    />
  );
}

/** An icon-only action in the toolbar, with an optional `tooltip`: HeroUI Pro's, named by `label`. */
function PromptInputAction({ label, ...rest }: PromptInputActionProps) {
  return <HeroPromptInput.Action {...rest} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface PromptInputParts {
  /** The surface that holds the content and the toolbar. */
  readonly Shell: typeof HeroPromptInput.Shell;
  /** The area above the toolbar: attachments and the text area. */
  readonly Content: typeof HeroPromptInput.Content;
  /** The row of attachment previews. */
  readonly Attachments: typeof HeroPromptInput.Attachments;
  /** The auto-growing text area, named by `label`. */
  readonly TextArea: typeof PromptInputTextArea;
  /** The row under the content, holding the actions and the send button. */
  readonly Toolbar: typeof HeroPromptInput.Toolbar;
  /** The start of the toolbar. */
  readonly ToolbarStart: typeof HeroPromptInput.ToolbarStart;
  /** The end of the toolbar. */
  readonly ToolbarEnd: typeof HeroPromptInput.ToolbarEnd;
  /** The note under the composer. */
  readonly Footer: typeof HeroPromptInput.Footer;
  /** The send button, named by `label`. */
  readonly Send: typeof PromptInputSend;
  /** An icon-only toolbar action, named by `label`. */
  readonly Action: typeof PromptInputAction;
  /** The queue of messages waiting to be sent, HeroUI Pro's own with its `Item` and `List` parts. */
  readonly Queue: typeof HeroPromptInput.Queue;
  /** A token (mention or command chip) in a token input. */
  readonly Token: typeof HeroPromptInput.Token;
  /** A text input that holds tokens. */
  readonly TokenInput: typeof HeroPromptInput.TokenInput;
  /** The suggestion list of a token input. */
  readonly TokenSuggestions: typeof HeroPromptInput.TokenSuggestions;
  /** The read-only display of a token input's tokens. */
  readonly Tokens: typeof HeroPromptInput.Tokens;
}

/** The message composer: a `PromptInput.Shell` of `Content` (`TextArea`) and a `Toolbar` (`Action`s and `Send`). */
export const PromptInput: typeof PromptInputRoot & PromptInputParts = Object.assign(
  PromptInputRoot,
  {
    Shell: HeroPromptInput.Shell,
    Content: HeroPromptInput.Content,
    Attachments: HeroPromptInput.Attachments,
    TextArea: PromptInputTextArea,
    Toolbar: HeroPromptInput.Toolbar,
    ToolbarStart: HeroPromptInput.ToolbarStart,
    ToolbarEnd: HeroPromptInput.ToolbarEnd,
    Footer: HeroPromptInput.Footer,
    Send: PromptInputSend,
    Action: PromptInputAction,
    Queue: HeroPromptInput.Queue,
    Token: HeroPromptInput.Token,
    TokenInput: HeroPromptInput.TokenInput,
    TokenSuggestions: HeroPromptInput.TokenSuggestions,
    Tokens: HeroPromptInput.Tokens,
  },
);

export type { ChatStatus } from "@heroui-pro/react/prompt-input";
