/**
 * Stackra file contract:
 * Purpose: the web `ChatSource` compound on HeroUI Pro's ChatSource: a citation chip for a URL or a document, with
 *          the parts Trigger, Icon, DocumentIcon, Title and Preview. Icon, DocumentIcon, Title and Preview are HeroUI
 *          Pro's own; Trigger is too, except on a source that opens a preview card: there HeroUI Pro wraps the link in
 *          a span that takes the card's `aria-haspopup` and `aria-expanded`, which a span may not carry, so the
 *          wrapper draws the same link and hands those to the link itself, through React Aria's `Focusable`.
 * Boundary: no styling of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's names for the
 *          chip's data (`href`, `title`, `description`, `sourceType`, `enablePreview`) stay as they are. The compound
 *          exposes the documented parts: HeroUI Pro's `ChatSource.Root` is left out. Imports the `chat-source`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { ChatSource as HeroChatSource, chatSourceVariants } from "@heroui-pro/react/chat-source";
import { createContext, useContext } from "react";
import { Focusable } from "react-aria-components";

import type { ChatSourceProps } from "#react/chat-source/chat-source.props";
import type { ChatSourceTriggerProps } from "#react/chat-source/chat-source-trigger.props";

/** The link of a source that opens a preview card, which the wrapper's Trigger draws; `undefined` for any other. */
const PreviewedHrefContext = createContext<string | undefined>(undefined);

/**
 * The chip root: HeroUI Pro's, which draws a link or a document chip from its data. It works out, by HeroUI Pro's rule,
 * whether the source opens a preview card, and draws its default parts with the wrapper's Trigger.
 */
function ChatSourceRoot({ children, ...rest }: ChatSourceProps) {
  const { description, enablePreview, href, title } = rest;
  const sourceType = rest.sourceType ?? (href ? "url" : "document");
  const isPreviewed =
    sourceType === "url" && Boolean(href) && (enablePreview ?? Boolean(description || title));
  return (
    <PreviewedHrefContext value={isPreviewed ? href : undefined}>
      <HeroChatSource.Root {...rest}>
        {children ?? (
          <>
            <ChatSourceTrigger />
            {isPreviewed ? <HeroChatSource.Preview /> : null}
          </>
        )}
      </HeroChatSource.Root>
    </PreviewedHrefContext>
  );
}

/**
 * The link that holds the icon and the title. On a previewed source it is drawn here, as HeroUI Pro draws it, but
 * inside React Aria's `Focusable`, so the link itself takes the card's trigger props; otherwise it is HeroUI Pro's.
 */
function ChatSourceTrigger(props: ChatSourceTriggerProps) {
  const href = useContext(PreviewedHrefContext);
  if (href === undefined) return <HeroChatSource.Trigger {...props} />;
  const { children, className, label, ...rest } = props;
  const slots = chatSourceVariants();
  return (
    <span className={slots.trigger({ className })} data-slot="chat-source-trigger">
      <Focusable>
        <a
          className={slots.triggerLink()}
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          {...rest}
        >
          {children ?? label ?? (
            <>
              <HeroChatSource.Icon />
              <HeroChatSource.Title />
            </>
          )}
        </a>
      </Focusable>
    </span>
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatSourceParts {
  /** The link that holds the icon and the title; on a previewed source, the card's trigger. */
  readonly Trigger: typeof ChatSourceTrigger;
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
  Trigger: ChatSourceTrigger,
  Icon: HeroChatSource.Icon,
  DocumentIcon: HeroChatSource.DocumentIcon,
  Title: HeroChatSource.Title,
  Preview: HeroChatSource.Preview,
});
