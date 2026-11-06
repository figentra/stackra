/**
 * Stackra file contract:
 * Purpose: `MONEY_METRIC_SCHEMA`, the zod schema of `MoneyMetric` this package ships (its `X$`): minor units for the
 *          value, the previous value, each bucket of the series and the target, each nullable, and the one currency
 *          they are all in.
 * Boundary: the stand-in for what gen will write for this package; a generated output schema reuses it for a field
 *           typed `MoneyMetric` (`revenue: MoneyMetric$`). The entry exports it as `MoneyMetric$`, and the class
 *           carries it as `MoneyMetric.schema`. A metric never mixes currencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0220 (money in minor units); ADR 0294 (decision 26).
 */
import { currencyCode } from "@stackra/money";

import { COUNT_METRIC_SCHEMA } from "#core/constants/count-metric-schema.constant";

/** The shipped `MoneyMetric$`: the count metric's integer fields (here minor units) and the currency. */
export const MONEY_METRIC_SCHEMA = COUNT_METRIC_SCHEMA.extend({ currency: currencyCode() });
