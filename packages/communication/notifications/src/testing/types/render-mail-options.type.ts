/**
 * Stackra file contract:
 * Purpose: `RenderMailOptions`, the third argument of `renderMail`: the locale to render in, and optional catalogues,
 *          i18n configuration and asset resolver for a test that wants its own.
 * Boundary: type only. Every option but `locale` has a default: the member's own lang files, the base
 *           `I18nConfig` defaults and the asset's source path.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: a package's test helpers live in its `./testing`); ADR 0080.
 */
import type { MailRenderOptions } from "#react/mail/mail-render-options.type";

/** How `renderMail` renders. */
export type RenderMailOptions = Pick<MailRenderOptions, "locale"> &
  Partial<Pick<MailRenderOptions, "messages" | "i18n" | "asset">>;
