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
import type { Size } from "#contracts/enums/size.enum";
import type { TextTone } from "#contracts/enums/text-tone.enum";
import type { IconComponent } from "#contracts/types/icon-component.type";

/** Props shared by the web and native `Icon`. */
export interface IconContractProps {
  /** The icon component to draw: a Lucide icon such as `ChevronRight`, or any component with the same props. */
  readonly as: IconComponent;
  /** The size: `sm` 16 px, `md` 20 px, `lg` 24 px. Left out, it is `md`, or the size the component holding it sets. */
  readonly size?: Size | undefined;
  /** The colour role it is drawn in, `muted` included as on Text. Left out, it takes the colour of its surroundings: the text on web, the holder on native. */
  readonly tone?: TextTone | undefined;
  /** What the icon means, read by screen readers. Left out or empty, the icon is decorative and hidden from them. */
  readonly label?: string | undefined;
  /** Whether it is drawn mirrored in right-to-left text: true for icons that point the reading way (arrows, chevrons). */
  readonly isMirroredInRtl?: boolean | undefined;
}
