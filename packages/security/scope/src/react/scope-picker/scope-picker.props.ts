/**
 * Stackra file contract:
 * Purpose: `ScopePickerProps`, what a host hands the web ScopePicker: the scopes the signed-in person may enter, the
 *          count above which the picker searches instead of showing the tree, and every word in `labels`.
 * Boundary: a type in its own file beside the component (ADR 0305). The active scope is the container's
 *           `ActiveScopeService`, read through `useScope`, never props. The list is the host's (its `GrantedScopes`
 *           answer from the generated client), because a client holds no list of granted scopes; the words are the
 *           host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0327 (decisions 7 and 10); ADR 0305; the UI build list
 *                     (2026-11-02).
 */
import type { ScopeEntry } from "#contracts/types/scope-entry.type";

/**
 * The scopes to offer and the picker's words.
 *
 * @example
 * <ScopePicker scopes={granted} labels={{ label: "Scope", emptyMessage: "No scope matches" }} />
 */
export interface ScopePickerProps {
  /** The scopes the person may enter, each with its display name; a scope below a listed one nests under it. */
  readonly scopes: readonly ScopeEntry[];
  /** Above this many scopes the picker becomes a search field instead of a tree. Defaults to 8. */
  readonly searchThreshold?: number | undefined;
  /** The picker's words; the host writes them. */
  readonly labels: {
    /** The visible label and accessible name, for example "Scope". */
    readonly label: string;
    /** Shown while no scope is active, for example "Choose a scope". */
    readonly placeholder?: string | undefined;
    /** What the search list says when nothing matches, for example "No scope matches". */
    readonly emptyMessage?: string | undefined;
  };
  /** Styles the root. */
  readonly className?: string | undefined;
}
