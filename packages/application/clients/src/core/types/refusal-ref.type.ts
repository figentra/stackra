/**
 * Stackra file contract:
 * Purpose: `RefusalRef`, the class `refusalRef`, `ClientRefusal` and `remoteRefusal` return: a producer's refusal as a
 *          `Refusal` class of this client, so `isRefusal(error, VariantNotFoundError)` and `refusal(...)` in tests work.
 * Boundary: a type only. The instances are `ClientError`s; `qualifiedCode` keeps the producer's module
 *           (`catalogue.variant_not_found`) while `code` is the class-derived code the envelope carries.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope); ADR 0232 (codes from class names); ADR 0260 (decision 2).
 */
import type { RefusalClass } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";

import type { ClientError } from "#core/types/client-error.type";

/** A consumed refusal class. */
export type RefusalRef = (abstract new () => ClientError) &
  Pick<RefusalClass, "create" | "envelope"> & {
    /** The module-qualified code (`catalogue.variant_not_found`). */
    readonly qualifiedCode: string;

    /** The producer's message key, when it declared one. */
    readonly messageKey?: I18nKey;
  };
