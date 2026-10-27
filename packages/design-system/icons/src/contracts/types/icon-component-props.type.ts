/**
 * Stackra file contract:
 * Purpose: `IconComponentProps`, the props a registry's consumer hands the component it draws: a pixel size, a colour
 *          and a stroke width, and the accessibility, tone and mirror props a component must spread onto its root.
 * Boundary: types only; no icon library is imported here, so the contract stays free of either runtime's package.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0302 (decision 3: one API, the contract shared); ADR 0305 (rules 10
 *                     and 12: one declaration per file); ADR 0165.
 */
/**
 * The props a registry's consumer hands the component it draws. `size`, `color` and `strokeWidth` are the drawing;
 * the rest is what `Icon` relies on for accessibility, the tone colour and the right-to-left mirror, so a component
 * that is meant to be decorative, labelled, tinted or mirrored must spread them onto its root element. Lucide icons
 * do; a custom SVG component that ignores them stays visible to assistive technology and cannot be mirrored.
 */
export interface IconComponentProps {
  /** The width and height in pixels, from the icon size: `sm` 16, `md` 20, `lg` 24. */
  readonly size?: number | string;
  /** The stroke colour, a resolved colour; native only, the web icon draws in `currentColor`. */
  readonly color?: string;
  /** The stroke width on the icon's 24-unit grid; Lucide draws 2 when it is left out. */
  readonly strokeWidth?: number | string;
  /** Web: the class the holder styles the icon with; a component must put it on its root element. */
  readonly className?: string;
  /** The tone colour (web) and the mirror transform, as the platform's own style object; it must reach the root. */
  readonly style?: object;
  /** Web: set for a decorative icon so screen readers skip it. */
  readonly "aria-hidden"?: boolean;
  /** Web: the accessible name of a labelled icon. */
  readonly "aria-label"?: string;
  /** Web and native: `img` on a labelled icon. */
  readonly role?: "img";
  /** Native: whether the icon is an accessibility element; false for a decorative one. */
  readonly accessible?: boolean;
  /** Native: the accessible name of a labelled icon. */
  readonly accessibilityLabel?: string;
  /** Native, iOS: hides a decorative icon from VoiceOver. */
  readonly accessibilityElementsHidden?: boolean;
  /** Native, Android: hides a decorative icon from TalkBack. */
  readonly importantForAccessibility?: "no-hide-descendants";
}
