/**
 * Stackra file contract:
 * Purpose: `AvatarGroupItem`, one person in an AvatarGroup: an id, the name its initials and accessible name come
 *          from, and an optional image.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); design-system gap inventory row 25.
 */

/** One avatar in an AvatarGroup. */
export interface AvatarGroupItem {
  /** A stable id, used as the React key. */
  readonly id: string;
  /** The person's or organisation's name: the initials and the avatar's accessible name. */
  readonly name: string;
  /** The image URL; the initials show when it is missing or fails. */
  readonly src?: string | undefined;
}
