/**
 * Stackra file contract:
 * Purpose: `I18nKey`, a translation key as code holds it: `<namespace>::<path>` (`web::nav.home`,
 *          `orders::enums.order_status.paid`), branded so a raw string where a key is expected is a type error.
 * Boundary: type only. The one way to make keys is `keys(...)`, which gen calls in `#stackra/i18n`; nothing else
 *           brands a string as a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys), ADR 0231 (`<module>::<path>` lookups), ADR 0294 (decision 20).
 */
import type { Branded } from "@stackra/contracts";

/** A translation key: `I18n.web.nav.home` is the key `web::nav.home`. */
export type I18nKey = Branded<string, "i18n.I18nKey">;
