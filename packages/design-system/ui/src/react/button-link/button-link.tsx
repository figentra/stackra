/**
 * Stackra file contract:
 * Purpose: the web `ButtonLink`: a link drawn as a button, for an action that goes somewhere (the landing's core
 *          pill, a "Read the docs" call to action). It takes the Button's `variant`, `shape` and `size`, the `core`
 *          variant and the `pill` shape included, so a link and a button of the same look share one source.
 * Boundary: React Aria's `Link` (a real anchor that navigates without script, and through the nearest
 *           `RouterProvider`) with HeroUI's `buttonVariants`, the composition HeroUI documents for a router link and
 *           the one PageActions and BentoCard use. The core and glass looks are the theme classes `@stackra/tokens`
 *           writes (`.button--core`, `.button--glass`); no colour of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (HeroUI v3 on web); STA-2041.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Link as AriaLink } from "react-aria-components";

import { glassButtonClasses } from "#react/button/glass-button-classes.function";
import type { ButtonLinkProps } from "#react/button-link/button-link.props";

/**
 * A link that looks like a button.
 *
 * @example
 * <ButtonLink href="/docs" variant="core" shape="pill">Read the docs</ButtonLink>
 */
export function ButtonLink({
  variant = "primary",
  shape,
  size,
  className,
  children,
  ...rest
}: ButtonLinkProps): ReactElement {
  const look = glassButtonClasses(variant, size);
  return (
    <AriaLink
      {...rest}
      className={cn(look, shape === "pill" && "rounded-[var(--radius-pill)]", className) ?? look}
    >
      {children}
    </AriaLink>
  );
}
