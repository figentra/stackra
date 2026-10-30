/**
 * Stackra file contract:
 * Purpose: the "animations" demo of the web Page skeleton: The section layout in each animation: a sweeping shimmer,
 *          a slow pulse and a still one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import { PageSkeleton as UiPageSkeleton, Text } from "@stackra/ui/react";
import type { ReactNode } from "react";

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 md:grid-cols-2";

/** The card a skeleton sits in, as a page or panel would hold it. */
const CARD = "border border-separator p-6";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={CARD}>{children}</div>
    </li>
  );
}

/** Page skeleton: Animations. */
export default function Animations() {
  return (
    <ul className={GRID}>
      {SkeletonAnimation.map((animationType) => (
        <Sample key={animationType} caption={`animationType="${animationType}"`}>
          <UiPageSkeleton
            layout="section"
            animationType={animationType}
            loadingLabel={`Loading with ${animationType}`}
          />
        </Sample>
      ))}
    </ul>
  );
}
