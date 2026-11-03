/**
 * Stackra file contract:
 * Purpose: `CtaRow`, the landing's call-to-action row: the primary link as the champagne pill (the page's one
 *          core action), a copy link and a mono command chip, each with its copy button.
 * Boundary: composition of @stackra/ui only; every word comes in props. The primary is @stackra/ui's `ButtonLink`
 *           (a real link that navigates without script, through the nearest router) in the Button's core variant and
 *           pill shape, so the champagne CTA has one source, the theme's `.button--core`. The command's
 *           copy button is named by its own word and the command, so it is told apart from the page's other copy
 *           buttons. The command stays left to right in Arabic: code is never translated or mirrored. Inside the
 *           hero it draws in the hero's band; alone, in its own ruled band.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0520 (the core); ADR 0060
 *                     (RTL); WCAG 2.2 SC 2.4.6; STA-2041.
 */
import { ButtonLink, CopyButton } from "@stackra/ui/react";
import { type ReactElement, useId } from "react";

import type { CtaRowProps } from "#react/cta-row/cta-row.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

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
        <ButtonLink href={primary.href} variant="core" shape="pill">
          {primary.label}
        </ButtonLink>
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
