/**
 * Stackra file contract:
 * Purpose: `DocumentRenderer`, the native component a screen places to draw an L2 document: `<DocumentRenderer
 *          document={this.props.data.document} onNavigate={(key) => this.open(key)} />`.
 * Boundary: composition only. The `Renderer` comes from the container (the generated wiring binds `native`), the
 *           locale from `@stackra/i18n`. Native blocks never navigate by themselves: their verbs reach `onNavigate` and
 *           `onAction`. A document the renderer refuses throws to the nearest error boundary.
 * Runtime: react-native
 * Governing contract: ADR 0110 (decisions 3 and 6); ADR 0112 (X5, X9); ADR 0263.
 */
import { useContainer } from "@stackra/container/react";
import { useLocale } from "@stackra/i18n/react";
import type { ReactNode } from "react";

import { Renderer } from "#contracts/ports/renderer.port";
import type { DocumentRendererProps } from "#native/document-renderer/document-renderer.props";

/**
 * Draws `document` with the blocks registered on native.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `Renderer`, or outside an `I18nProvider`.
 * @throws UnknownBlockError, InvalidDocumentError when the document is refused.
 * @example
 * <DocumentRenderer document={this.props.data.document} onNavigate={(key: RouteKey) => this.open(key)} />
 */
export function DocumentRenderer({ document, ...handlers }: DocumentRendererProps): ReactNode {
  const renderer = useContainer().get(Renderer);
  const { locale } = useLocale();
  return renderer.render(document, { ...handlers, locale }) as ReactNode;
}
