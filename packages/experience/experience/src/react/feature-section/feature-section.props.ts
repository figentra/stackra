/**
 * Stackra file contract:
 * Purpose: `FeatureSectionProps`, what a page hands the FeatureSection block: the heading and the features.
 * Boundary: an interface in its own file beside the component (ADR 0305). Copy and icons are page content (a document
 *           node's props or the tenant's settings); the block hard-codes none of them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`).
 */
import type { IconSlot } from "@stackra/ui/contracts";

/**
 * A heading over a grid of features.
 *
 * @example
 * <FeatureSection title="Everything a shop needs" features={features} />
 */
export interface FeatureSectionProps {
  /** A short line over the title: "Why us". */
  readonly eyebrow?: string | undefined;
  /** The section's heading. */
  readonly title: string;
  /** A line of text under the title. */
  readonly description?: string | undefined;
  /** The features, one grid cell each, in the order shown. */
  readonly features: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly icon?: IconSlot | undefined;
  }[];
  /** Columns on a wide screen; default 3. Narrow screens stack. */
  readonly columns?: 2 | 3 | 4 | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
}
