/**
 * Stackra file contract:
 * Purpose: `PosthogScope`, the scope a PostHog query is narrowed to: the event property and the caller's scope id, or
 *          null when the project holds one scope's events.
 * Boundary: internal; a type only. The `posthog` driver builds it from its settings and the running call.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0323 (scope isolation).
 */

/** The scope a PostHog query is narrowed to. */
export type PosthogScope = { readonly property: string; readonly id: string } | null;
