/**
 * Stackra file contract:
 * Purpose: `SurfacesProps`, what a page hands the Surfaces: the group's spoken name and the surfaces the action
 *          reaches, each a frame with its button.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (design pass §2, the Draw
 *                     station).
 */
import type { SurfaceFrameProps } from "#react/surfaces/surface-frame.props";

/**
 * The same button on every surface.
 *
 * @example
 * <Surfaces label="Cancel order on every surface" surfaces={[
 *   { id: "web", kind: "web", title: "orders.example", button: "Cancel order" },
 *   { id: "phone-ar", kind: "phone", title: "Phone", button: "إلغاء الطلب", lang: "ar" },
 * ]} />
 */
export interface SurfacesProps {
  /** The group's spoken name, such as "Cancel order on every surface". */
  readonly label: string;
  /** The surfaces, in reading order. */
  readonly surfaces: readonly SurfaceFrameProps["surface"][];
  /** Styles the row. */
  readonly className?: string | undefined;
}
