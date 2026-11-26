/**
 * Stackra file contract:
 * Purpose: `PackageListProps`, the props of the web `PackageList` in `package-list.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */

/** Props of the web PackageList. */
export interface PackageListProps {
  /** The packages: an npm name (never translated), a one-line description and an optional link. */
  readonly items: readonly {
    readonly name: string;
    readonly description: string;
    readonly href?: string | undefined;
  }[];
  /** The rows shown; the rest are left out. Defaults to 5. */
  readonly maxVisible?: number | undefined;
  /** Fades the last rows shown, to say the list goes on. Defaults to true. */
  readonly hasFade?: boolean | undefined;
  /** The list's spoken name, for example "Stackra packages". */
  readonly label: string;
  /** Styles the list. */
  readonly className?: string | undefined;
}
