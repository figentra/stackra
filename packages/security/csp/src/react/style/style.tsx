/**
 * Stackra file contract:
 * Purpose: `Style`, a `<style>` element that carries the request's CSP nonce, so a server-rendered stylesheet (a
 *          tenant's theme colours) applies under a policy with no `'unsafe-inline'` for styles.
 * Boundary: renders one `<style>` with the nonce from `useNonce()` and the given attributes; the CSS is a text child,
 *           never raw HTML. Validating the CSS is the caller's job (the site layout checks the token grammar first).
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0302 (design system tokens); ADR 0294 (decision 23).
 */
import type { ReactNode } from "react";

import { useNonce } from "#react/nonce/use-nonce";

import type { StyleProps } from "./style-props.type";

/**
 * A stylesheet element with the request's nonce.
 *
 * @example
 * {css && <Style data-brand>{css}</Style>}
 */
export function Style({ children, ...attributes }: StyleProps): ReactNode {
  return (
    <style {...attributes} nonce={useNonce()}>
      {children}
    </style>
  );
}
