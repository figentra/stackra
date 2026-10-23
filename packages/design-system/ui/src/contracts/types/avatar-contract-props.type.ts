/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Avatar` takes: the name its initials come from, the image, the accessible
 *          name, the size, tone, variant and shape, and a fallback element. Each runtime's `AvatarProps` is this
 *          plus its HeroUI avatar root's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0304; WCAG 2.2
 *          SC 1.1.1.
 */
import type { ReactNode } from "react";

import type { AvatarShape } from "#contracts/enums/avatar-shape.enum";
import type { AvatarVariant } from "#contracts/enums/avatar-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { Tone } from "#contracts/enums/tone.enum";

/** Props shared by the web and native `Avatar`. */
export interface AvatarContractProps {
  /** The person's or organisation's name; its initials are drawn when there is no image. */
  readonly name?: string | undefined;
  /** The image URL; the fallback shows when it is missing or fails to load. */
  readonly src?: string | undefined;
  /** The accessible name; without it the avatar is decorative and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** The diameter and the text size of the initials. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The colour role of the initials and fallback icon. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** The background behind the fallback: neutral or the tone's soft colour. Defaults to `default`. */
  readonly variant?: AvatarVariant | undefined;
  /** A circle for people, a rounded square for organisations. Defaults to `circle`. */
  readonly shape?: AvatarShape | undefined;
  /** An element drawn in place of the initials, usually an `Icon`; sized and coloured like the initials. */
  readonly fallback?: ReactNode;
}
