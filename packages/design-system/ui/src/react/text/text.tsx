/**
 * Stackra file contract:
 * Purpose: the web `Text` on HeroUI v3 Typography: maps the shared contract (`type` to HeroUI's body types, `tone` to
 *          `color` plus the theme's colour utility, `isTruncated` to `truncate`, `lang` to `lang` and `dir`) and
 *          passes every other Typography prop through unchanged.
 * Boundary: no styling of its own; the type scale is the theme's restyling of HeroUI's classes (@stackra/tokens), the
 *          Arabic styles its `:lang(ar)` rule.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0165 (UI contract, HeroUI v3 on web).
 */
import type { ReactElement } from "react";
import { Typography } from "@heroui/react";

import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { TYPOGRAPHY_TYPE } from "#core/constants/typography-type.constant";
import { directionOf } from "#core/functions/direction-of.function";
import type { TextProps } from "#react/text/text.props";

/**
 * Running text in the theme's type scale. A `lang` marks text in another language than the page and sets its
 * direction; the theme's `:lang(ar)` rule then draws it in the Arabic style. Pass `render` to draw a `span` inside
 * a sentence.
 */
export function Text({
  type = "body",
  tone = "default",
  align,
  isTruncated,
  lang,
  className,
  ...rest
}: TextProps): ReactElement {
  return (
    <Typography
      type={TYPOGRAPHY_TYPE[type]}
      color={tone === "muted" ? "muted" : "default"}
      align={align ?? "start"}
      truncate={isTruncated ?? false}
      className={[TONE_CLASS_NAME[tone], className].filter(Boolean).join(" ")}
      {...(lang ? { lang, dir: directionOf(lang) } : {})}
      {...rest}
    />
  );
}
