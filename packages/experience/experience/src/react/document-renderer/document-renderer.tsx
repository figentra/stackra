/**
 * Stackra file contract:
 * Purpose: `DocumentRenderer`, the web component a page places to draw an L2 document (a scope's page, a product
 *          description): `<DocumentRenderer document={this.props.data.page.root} />`.
 * Boundary: composition only. The `Renderer` comes from the container (the generated wiring binds `react`), the locale
 *           from `@stackra/i18n`; both are read on every render, so a locale switch redraws in the new language. A
 *           document the renderer refuses throws to the nearest error boundary.
 * Runtime: browser
 * Governing contract: ADR 0110 (decision 6); ADR 0112 (X5); ADR 0114 (decision 1: every page is a document); ADR 0263.
 */
import { useContainer } from "@stackra/container/react";
import { useLocale } from "@stackra/i18n/react";
import type { ReactNode } from "react";

import { Renderer } from "#contracts/ports/renderer.port";
import type { DocumentRendererProps } from "#react/document-renderer/document-renderer.props";

/**
 * Draws `document` with the blocks registered on the web.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `Renderer`, or outside an `I18nProvider`.
 * @throws UnknownBlockError, InvalidDocumentError when the document is refused.
 * @example
 * <DocumentRenderer document={product.description} />
 */
export function DocumentRenderer({ document, ...handlers }: DocumentRendererProps): ReactNode {
  const renderer = useContainer().get(Renderer);
  const { locale } = useLocale();
  return renderer.render(document, { ...handlers, locale }) as ReactNode;
}
