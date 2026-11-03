/**
 * Stackra file contract:
 * Purpose: `AskAi`, the landing kit's ask-the-docs entry: a link drawn as a search field (its name, a greyed
 *          sample question and an Enter key hint) that opens the docs; until the assistant's gateway is live it is
 *          drawn quiet, with a coming-soon note that describes the link.
 * Boundary: composition of @stackra/ui's `Link`, `Kbd` and `Text`; a link, not a field, so it never takes text. The
 *           sample question and the key hint are hidden from assistive tech; the link's name is `label`. Every word
 *           comes in props. On the page it draws in its own ruled band; inside another block (a bento grid) in that
 *           block's.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL);
 *          STA-2041.
 */
import { Kbd, Link, Text } from "@stackra/ui/react";
import { type ReactElement, useId } from "react";

import type { AskAiProps } from "#react/ask-ai/ask-ai.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/**
 * A search-field-shaped link to the docs.
 *
 * @example
 * <AskAi label="Ask the docs" docsUrl="/docs/search" comingSoonNote="Answers here are coming soon." />
 */
export function AskAi({
  label,
  docsUrl,
  placeholder,
  isComingSoon = true,
  comingSoonNote,
  className,
}: AskAiProps): ReactElement {
  const noteId = useId();
  const hasNote = isComingSoon && Boolean(comingSoonNote);
  return (
    <RuledBand>
      <div
        data-slot="ask-ai"
        {...(isComingSoon ? { "data-coming-soon": "" } : {})}
        className={`flex w-full max-w-xl flex-col gap-2 ${className ?? ""}`}
      >
        <Link
          href={docsUrl}
          underline="hover"
          {...(hasNote ? { "aria-describedby": noteId } : {})}
          className={`flex h-11 items-center gap-3 rounded-field border border-field-border bg-field px-3 no-underline outline-hidden hover:border-field-border-hover focus-visible:ring-2 focus-visible:ring-focus ${isComingSoon ? "border-dashed text-muted" : "text-foreground"}`}
        >
          <span className="shrink-0 font-medium">{label}</span>
          {placeholder ? (
            <span aria-hidden="true" className="min-w-0 flex-1 truncate text-field-placeholder">
              {placeholder}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <Kbd aria-hidden="true">
            <Kbd.Content>{"↵"}</Kbd.Content>
          </Kbd>
        </Link>
        {hasNote ? (
          <Text id={noteId} tone="muted" type="small">
            {comingSoonNote}
          </Text>
        ) : null}
      </div>
    </RuledBand>
  );
}
