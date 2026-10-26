/**
 * Stackra file contract:
 * Purpose: the web `Widget` compound on HeroUI Pro's Widget (a dashboard card): the root and the parts Header,
 *          Title, Description, Content, Footer, Legend and LegendItem, with HeroUI Pro's own names.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: `LegendItem`'s `color` is a CSS
 *          colour for its dot, not a colour role. The compound exposes the documented parts: HeroUI Pro's
 *          `Widget.Root` is left out. Imports the `widget` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { Widget as HeroWidget } from "@heroui-pro/react/widget";

import type { WidgetProps } from "#react/widget/widget.props";

/** The root: HeroUI Pro's, a card that holds the widget. */
function WidgetRoot(props: WidgetProps) {
  return <HeroWidget.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface WidgetParts {
  /** The header row: title and description. */
  readonly Header: typeof HeroWidget.Header;
  /** The widget's name. */
  readonly Title: typeof HeroWidget.Title;
  /** The supporting text under the title. */
  readonly Description: typeof HeroWidget.Description;
  /** The body, usually a chart or a figure. */
  readonly Content: typeof HeroWidget.Content;
  /** The footer, for a note or actions. */
  readonly Footer: typeof HeroWidget.Footer;
  /** The row of legend items. */
  readonly Legend: typeof HeroWidget.Legend;
  /** One legend entry: a coloured dot and its label. */
  readonly LegendItem: typeof HeroWidget.LegendItem;
}

/** A dashboard card: `Widget.Header` holds `Title` and `Description`, then `Content`, `Legend` and `Footer`. */
export const Widget: typeof WidgetRoot & WidgetParts = Object.assign(WidgetRoot, {
  Header: HeroWidget.Header,
  Title: HeroWidget.Title,
  Description: HeroWidget.Description,
  Content: HeroWidget.Content,
  Footer: HeroWidget.Footer,
  Legend: HeroWidget.Legend,
  LegendItem: HeroWidget.LegendItem,
});
