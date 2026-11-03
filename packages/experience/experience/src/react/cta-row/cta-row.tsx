/**
 * Stackra file contract:
 * Purpose: `CtaRow`, the landing's call-to-action row: the primary link as the champagne pill (the page's one
 *          core action), a copy link and a mono command chip, each with its copy button.
 * Boundary: composition of @stackra/ui only; every word comes in props. The primary is a real link styled as HeroUI's
 *           core button, so it navigates without script. The command stays left to right in Arabic: code is never
 *           translated or mirrored.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (RTL); STA-2041.
 */
import { CopyButton } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { CtaRowProps } from "#react/cta-row/cta-row.props";

/** HeroUI's primary button filled by the theme's core (`.button--core`, from `@stackra/tokens`), as a pill. */
const PRIMARY = "button button--md button--primary button--core rounded-[var(--radius-pill)]";

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
  return (
    <div data-slot="cta-row" className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      <a href={primary.href} className={PRIMARY}>
        {primary.label}
      </a>
      {copyLink ? (
        <span data-slot="cta-row-copy-link" className={CHIP}>
          {/* The button carries the same words as its name, so these are not read twice. */}
          <span aria-hidden="true">{copyLink.label}</span>
          <CopyButton value={copyLink.value} label={copyLink.label} size="sm" />
        </span>
      ) : null}
      {command ? (
        <span data-slot="cta-row-command" dir="ltr" className={`${CHIP} font-mono`}>
          <code>
            <span aria-hidden="true" className="text-muted">
              {"$ "}
            </span>
            {command}
          </code>
          <CopyButton value={command} size="sm" />
        </span>
      ) : null}
    </div>
  );
}
