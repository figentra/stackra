/**
 * Stackra file contract:
 * Purpose: `SurfaceFrameProps`, the one surface a `SurfaceFrame` draws: its kind, its title and the words of the
 *          button it shows, with the language they are in.
 * Boundary: an interface in its own file beside the component (ADR 0305). Internal to the `./react` entry; the hero's
 *           machine and `Surfaces` take the same surface shape. Every word is page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (design pass §2).
 */

/**
 * One surface the action reaches.
 *
 * @example
 * <SurfaceFrame surface={{ id: "phone-ar", kind: "phone", title: "Phone", button: "إلغاء الطلب", lang: "ar" }} />
 */
export interface SurfaceFrameProps {
  /** The surface the frame draws. */
  readonly surface: {
    /** The surface's name in the machine's pipes; unique in its list. */
    readonly id: string;
    /** Its chrome: a browser `web` window, a `desktop` app window, or a `phone`. */
    readonly kind: "web" | "desktop" | "phone";
    /** The window's title (an address or the app's name); a phone draws no title bar. */
    readonly title: string;
    /** The words of the button the surface shows, such as "Cancel order". */
    readonly button: string;
    /** The words' language as a BCP 47 tag, such as `ar`; given, the surface takes its direction. */
    readonly lang?: string | undefined;
  };
}
