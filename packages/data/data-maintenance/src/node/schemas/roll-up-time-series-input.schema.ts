/**
 * Stackra file contract:
 * Purpose: `RollUpTimeSeriesInput`, the input of the `data_maintenance.timeseries.rollup` job: none, it keeps every
 *          registered series.
 * Boundary: a schema with no fields.
 * Runtime: node
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 28: the job surface); ADR 0462 (decision 1).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields: the job keeps every registered `TimeSeries`. */
export class RollUpTimeSeriesInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[RollUpTimeSeriesInput, z.object({})]]);
