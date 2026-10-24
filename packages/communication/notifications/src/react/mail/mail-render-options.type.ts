/**
 * Stackra file contract:
 * Purpose: `MailRenderOptions`, what the mail renderer needs besides the body and its data: the recipient's locale,
 *          its merged catalogues, the member's i18n configuration and the asset URL resolver.
 * Boundary: type only. The catalogues arrive merged along the locale's fallback chain; the renderer loads nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (catalogues), ADR 0192 (digits), ADR 0234 (assets by key).
 */
import type { AssetEntry } from "@stackra/assets";
import type { formatMessage, I18nConfig, Locale } from "@stackra/i18n";

/** The recipient side of one mail render. */
export interface MailRenderOptions {
  /** The recipient's locale. */
  readonly locale: Locale;

  /** The locale's catalogues by namespace, merged along its fallback chain. */
  readonly messages: Parameters<typeof formatMessage>[0];

  /** The member's i18n configuration: its right-to-left locales and digits. */
  readonly i18n: I18nConfig;

  /** The public URL of a module asset. */
  readonly asset: (entry: AssetEntry) => string;
}
