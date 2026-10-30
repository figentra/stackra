/**
 * Stackra file contract:
 * Purpose: `ToastAvatar`, the person a toast is about, drawn in place of its tone icon (the `bubble` look's subject).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */

/** The person a toast is about: initials from the name, or the image. */
export interface ToastAvatar {
  /** The person's name; its initials show when there is no image. */
  readonly name: string;
  /** The image URL. */
  readonly src?: string | undefined;
}
