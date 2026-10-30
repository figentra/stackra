/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Icon` takes, on web (`./react`, lucide-react) and native (`./native`,
 *          lucide-react-native): which icon, its size and tone, whether it means something (a label) or decorates,
 *          and whether it mirrors when text runs right to left. Each runtime's `IconProps` is this plus the drawn
 *          SVG's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract); ADR 0060 (right-to-left).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { Size } from "#contracts/enums/size.enum";
import type { TextTone } from "#contracts/enums/text-tone.enum";

/** Props shared by the web and native `Icon`. */
export interface IconContractProps {
  /** The icon to draw, by name: a Lucide name such as `chevron-right`, an alias, or a namespaced custom icon. A name no registry holds draws nothing. */
  readonly name: IconName;
  /** The size: `sm` 16 px, `md` 20 px, `lg` 24 px. Left out, it is `md`, or the size the component holding it sets. */
  readonly size?: Size | undefined;
  /** The colour role it is drawn in, `muted` included as on Text. Left out, it takes the colour of its surroundings: the text on web, the holder on native. */
  readonly tone?: TextTone | undefined;
  /** What the icon means, read by screen readers. Left out or empty, the icon is decorative and hidden from them. */
  readonly label?: string | undefined;
  /** Whether it is drawn mirrored in right-to-left text. Left out, an icon that points the reading way (arrows, chevrons, panel sides, the external link: `isDirectionalIcon`) mirrors and any other does not; `false` keeps a directional one as drawn. */
  readonly isMirroredInRtl?: boolean | undefined;
}
