/**
 * Stackra file contract:
 * Purpose: the web `Bidi`: inline, a `<bdi>` that isolates a SKU, phone number, e-mail or Latin name from the
 *          Arabic sentence around it (and the reverse); as a block, a `<div dir>` that also gives React Aria a locale
 *          of that direction, so arrow keys, placement and `useDirection` inside it follow the local direction.
 * Boundary: no styling; the element and its `dir` only. Every other attribute passes through.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060
 *          (right-to-left); ADR 0165 (React Aria on web).
 */
import type { ReactElement } from "react";
import { I18nProvider, useLocale } from "react-aria-components";

import { localeForDirection } from "#core/functions/locale-for-direction.function";
import type { BidiProps } from "#react/bidi/bidi.props";

/** A run of text isolated from its sentence, or a block with its own direction. */
export function Bidi({
  children,
  dir = "auto",
  isBlock = false,
  ...rest
}: BidiProps): ReactElement {
  const { locale } = useLocale();
  if (!isBlock)
    return (
      <bdi {...rest} dir={dir}>
        {children}
      </bdi>
    );
  const block = (
    <div {...rest} dir={dir}>
      {children}
    </div>
  );
  // `auto` cannot be known before the text renders, so only a fixed direction reaches React Aria.
  return dir === "auto" ? (
    block
  ) : (
    <I18nProvider locale={localeForDirection(locale, dir)}>{block}</I18nProvider>
  );
}
