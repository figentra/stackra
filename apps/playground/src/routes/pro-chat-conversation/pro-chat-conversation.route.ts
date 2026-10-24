/**
 * Stackra file contract:
 * Purpose: the ChatConversation route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-chat-conversation.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 12).
 */
import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra/ui-pro` ChatConversation page, at `/pro-chat-conversation`. */
// shortcut: a plain class until the Route kind base ships with gen (STA-339); then
// `export class ProChatConversationRoute extends Route({ path: "/pro-chat-conversation" }) {}`.
// oxlint-disable-next-line typescript/no-extraneous-class -- the Route kind base replaces the static fields
export class ProChatConversationRoute {
  /** The URL path of the route: `/` and the folder name, which the e2e suite relies on. */
  static readonly path = "/pro-chat-conversation";

  /** The page title, the component's name. */
  static readonly title = "ChatConversation";

  /** The category the page is listed under: the `@stackra/ui-pro` pages. */
  static readonly category: PageCategory = "AI";
}
