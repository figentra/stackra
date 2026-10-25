/**
 * Stackra file contract:
 * Purpose: the `TranslationProvider` port: the only way `@stackra/i18n` reaches an outside translator (machine
 *          translation or a TMS), one batch of ICU messages at a time.
 * Boundary: an abstract class that is its own token, key `i18n.TranslationProvider`. Drivers are connectors delivered
 *           through the integrations service and marketplace (Google Translate, DeepL, AWS Translate, the AI runtime),
 *           never built in here (ADR 0236 decisions 2 to 4). A machine translation is a draft: Arabic still needs the
 *           native reviewer (ADR 0192). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0236 (decision 1); ADR 0192 (decision 1); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { TranslationRequest } from "#contracts/types/translation-request.type";

/**
 * Translates catalogue messages.
 *
 * @example
 * const [subject] = await translator.translate({ messages: ["Order {id} is ready"], from: "en", to: "ar" });
 */
export abstract class TranslationProvider extends Port {
  /** Type-only port key. */
  declare readonly "~key": "i18n.TranslationProvider";

  /**
   * The messages of `request` in `request.to`, in the same order and with every placeholder kept.
   *
   * @throws ProviderUnavailableError when the translator does not answer.
   */
  abstract translate(request: TranslationRequest): Promise<readonly string[]>;
}
