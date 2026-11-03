/**
 * Stackra file contract:
 * Purpose: `CtaRow`, the landing's call-to-action row: the primary link as the champagne pill (the page's one
 *          core action), a copy link and a mono command chip, each with its copy button.
 * Boundary: composition of @stackra/ui only; every word comes in props. The primary is @stackra/ui's `Link` (a real
 *           link that navigates without script, through the nearest router) drawn as the core pill in the theme's
 *           core roles; @stackra/ui's `Button` is a button, not a link, so it cannot carry an `href`. The command's
 *           copy button is named by its own word and the command, so it is told apart from the page's other copy
 *           buttons. The command stays left to right in Arabic: code is never translated or mirrored. Inside the
 *           hero it draws in the hero's band; alone, in its own ruled band.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0520 (the core); ADR 0060
 *                     (RTL); WCAG 2.2 SC 2.4.6; STA-2041.
 */
import { CopyButton, Link } from "@stackra/ui/react";
import { type ReactElement, useId } from "react";

import type { CtaRowProps } from "#react/cta-row/cta-row.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/**
 * The core pill: the theme's core fill and its foreground, falling back to the accent's where a theme has no core,
 * as the core button does (`@stackra/tokens`), with the kit's focus ring. The foreground is important: it must win
 * over the link colour the `Link` draws.
 */
const PRIMARY =
  "inline-flex h-10 items-center rounded-[var(--radius-pill)] bg-[color:var(--core-strong,var(--accent))] px-4 text-sm font-medium text-[color:var(--core-foreground,var(--accent-foreground))]! no-underline outline-none hover:bg-[color:var(--core-hover,var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-focus";

/** A pill holding words and a copy button. */
const CHIP =
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-surface ps-4 pe-1 text-sm";

/**
 * The primary link, a copy link and a command.
 *
 * @example
 * <CtaRow primary={{ label: "Read the docs", href: "/docs" }} copyLink={{ label: "Copy llms.txt", value: url }} />
 */
export function CtaRow({ primary, copyLink, command, className }: CtaRowProps): ReactElement {
  const copyId = useId();
  const commandId = useId();
  return (
    <RuledBand>
      <div data-slot="cta-row" className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
        <Link href={primary.href} underline="hover" className={PRIMARY}>
          {primary.label}
        </Link>
        {copyLink ? (
          <span data-slot="cta-row-copy-link" className={CHIP}>
            {/* The button carries the same words as its name, so these are not read twice. */}
            <span aria-hidden="true">{copyLink.label}</span>
            <CopyButton value={copyLink.value} label={copyLink.label} size="sm" />
          </span>
        ) : null}
        {command ? (
          <span data-slot="cta-row-command" dir="ltr" className={`${CHIP} font-mono`}>
            <code id={commandId}>
              <span aria-hidden="true" className="text-muted">
                {"$ "}
              </span>
              {command}
            </code>
            {/* Named by its own word ("Copy", then "Copied") and the command: "Copy stackra create my-app". */}
            <CopyButton
              value={command}
              size="sm"
              id={copyId}
              aria-labelledby={`${copyId} ${commandId}`}
            />
          </span>
        ) : null}
      </div>
    </RuledBand>
  );
}
