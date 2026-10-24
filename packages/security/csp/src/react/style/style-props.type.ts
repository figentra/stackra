/**
 * Stackra file contract:
 * Purpose: `StyleProps`, the props of `Style`: the attributes of a `<style>` element (including `data-*`) and its CSS
 *          text as the one child.
 * Boundary: a type only (ADR 0305 rules 10 to 12). `nonce` is not a prop (it is the request's) and neither is
 *           `dangerouslySetInnerHTML` (the CSS is a text child, which React escapes for a `<style>` element).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 12); ADR 0237.
 */
import type { ComponentProps } from "react";

/** The props of `Style`. */
export interface StyleProps extends Omit<
  ComponentProps<"style">,
  "children" | "nonce" | "dangerouslySetInnerHTML"
> {
  /** The stylesheet text. */
  readonly children: string;
}
