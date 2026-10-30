/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AvatarGroup` takes: the people, how many show before the overflow count, the
 *          group's accessible name and the size, tone, variant and shape every avatar shares.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); design-system gap inventory row 25.
 */
import type { AvatarContractProps } from "#contracts/types/avatar-contract-props.type";
import type { AvatarGroupItem } from "#contracts/types/avatar-group-item.type";

/** Props shared by the web and native `AvatarGroup`. */
export interface AvatarGroupContractProps extends Pick<
  AvatarContractProps,
  "size" | "tone" | "variant" | "shape"
> {
  /** The people, in the order they stack (the first on the inline-start side). */
  readonly items: readonly AvatarGroupItem[];
  /** How many avatars show before a "+N" count stands for the rest. Defaults to 4. */
  readonly max?: number | undefined;
  /** The group's accessible name, for example "Assigned staff". */
  readonly label: string;
}
