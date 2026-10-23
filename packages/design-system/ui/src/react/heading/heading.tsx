/**
 * Stackra file contract:
 * Purpose: the web `Heading` on HeroUI v3 Typography: renders the `h<level>` element for the outline and draws the
 *          style `type` (default the level's), with the shared tone, alignment, truncation and language.
 * Boundary: no styling of its own; the element is chosen through React Aria's `render`, so HeroUI's classes stay on it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0165 (UI contract); WCAG 2.2 SC 1.3.1.
 */
import { Typography, type TypographyRootProps } from "@heroui/react";
import { createElement } from "react";

import type { HeadingContractProps } from "#contracts/types/heading-contract-props.type";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { directionOf } from "#core/functions/direction-of.function";

/**
 * Props of the web Heading: the shared contract plus HeroUI v3 Typography's props except the element choice, which
 * the level owns. HeroUI's `color` and `truncate` are the contract's `tone` and `isTruncated`.
 */
export type HeadingProps = HeadingContractProps &
  Omit<TypographyRootProps, keyof HeadingContractProps | "color" | "truncate" | "render">;

/**
 * A heading: `level` is its place in the document outline and the element (`h1` to `h6`), `type` its look, which
 * defaults to the level's. HeroUI's own `Typography.Heading` ties the element to the look, which the contract keeps
 * apart, so the element is chosen with React Aria's `render`.
 */
export function Heading({
  level,
  type = `h${level}`,
  tone = "default",
  align,
  isTruncated,
  lang,
  className,
  ...rest
}: HeadingProps) {
  return (
    <Typography
      type={type}
      color={tone === "muted" ? "muted" : "default"}
      align={align ?? "start"}
      truncate={isTruncated ?? false}
      className={[TONE_CLASS_NAME[tone], className].filter(Boolean).join(" ")}
      render={(domProps) => createElement(`h${level}`, domProps)}
      {...(lang ? { lang, dir: directionOf(lang) } : {})}
      {...rest}
    />
  );
}
