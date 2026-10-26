/**
 * Stackra file contract:
 * Purpose: the native `Widget` compound on HeroUI Native Pro's Widget (a dashboard card): the root and the parts
 *          Background, Header, Title, Description, Content, Footer, Legend and LegendItem, with HeroUI Native Pro's
 *          own names.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: `LegendItem`'s `color` is a colour
 *          value for its dot, not a colour role. The compound exposes the parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Widget as HeroWidget } from "heroui-native-pro/widget";
import type { ReactElement } from "react";
import type { WidgetProps } from "#native/widget/widget.props";

/** The root: HeroUI Native Pro's, a card that holds the widget. */
function WidgetRoot(props: WidgetProps): ReactElement {
  return <HeroWidget {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface WidgetParts {
  /** The theme-aware background layer behind the card. */
  readonly Background: typeof HeroWidget.Background;
  /** The header row: title and description. */
  readonly Header: typeof HeroWidget.Header;
  /** The widget's name, read as a header by screen readers. */
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
  Background: HeroWidget.Background,
  Header: HeroWidget.Header,
  Title: HeroWidget.Title,
  Description: HeroWidget.Description,
  Content: HeroWidget.Content,
  Footer: HeroWidget.Footer,
  Legend: HeroWidget.Legend,
  LegendItem: HeroWidget.LegendItem,
});
