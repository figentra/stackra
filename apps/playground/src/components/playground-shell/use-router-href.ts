/**
 * Stackra file contract:
 * Purpose: `useRouterHref`, the href resolver the shell gives React Aria's RouterProvider: app paths resolve through
 *          React Router's `useHref`, and absolute URLs (`https:`, `mailto:`) pass through untouched.
 * Boundary: a hook; React Aria calls it for every link, so it calls `useHref` unconditionally.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5).
 */
import { useHref } from "react-router";

/** An absolute URL starts with a scheme. */
const SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** Resolves `href` like React Router does, except an absolute URL, which React Router would treat as a path. */
export function useRouterHref(href: string): string {
  const resolved = useHref(href);
  return SCHEME.test(href) ? href : resolved;
}
