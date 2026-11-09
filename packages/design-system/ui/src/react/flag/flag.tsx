/**
 * Stackra file contract:
 * Purpose: the web `Flag`: a country's flag drawn as its emoji (`flagOf`, as `CountrySelect` draws it), named for
 *          assistive technology when it has a label and hidden from it when it does not.
 * Boundary: no flag assets ship: a language tag shows its region's flag, and a code with no flag (a language alone, or
 *           a platform without flag emoji, which shows the two letters) falls back to the code as text. Never mirrored.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1; STA-1981.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { flagOf } from "#core/functions/flag-of.function";
import type { FlagProps } from "#react/flag/flag.props";

/** The text size of each flag size: an emoji is as tall as its font. */
const SIZES = { sm: "text-base", md: "text-xl", lg: "text-3xl" } as const;

/** A country's flag. */
export function Flag({ code, label, size = "md", className }: FlagProps): ReactElement {
  // `ar-SA` and `ar_SA` show Saudi Arabia's flag; a bare two-letter code is a country.
  const region = code.split(/[-_]/).at(-1) ?? code;
  const glyph = flagOf(region);
  return (
    <span
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      data-code={code}
      className={
        cn(
          "inline-block shrink-0 leading-none",
          glyph ? SIZES[size] : "text-xs font-semibold text-muted uppercase",
          className,
        ) ?? ""
      }
    >
      {glyph || code}
    </span>
  );
}
