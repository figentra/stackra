/**
 * Stackra file contract:
 * Purpose: `TABLE_INPUT_SCHEMA`, the zod schema of the unnarrowed `TableInput` that this package ships (its `X$`): an
 *          optional cursor, a limit of 20, 50 or 100 (20 by default), an optional sort and a filter (`{}` by default).
 * Boundary: the stand-in for what gen will write for this package. Gen narrows a subclass to its resource table's sort
 *           keys and filters (ADR 0307); this schema accepts any sort key and filter. Internal: `table-input.schema.ts`
 *           registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0307 (resource tables).
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";

/** The shipped `TableInput$`: cursor, limit, optional sort and filter. */
export const TABLE_INPUT_SCHEMA = z.object({
  cursor: z.string().exactOptional(),
  limit: z.union([z.literal(20), z.literal(50), z.literal(100)]).default(20),
  sort: z
    .object({ key: z.string().min(1), direction: z.enum(Enum.values(SortDirection)) })
    .exactOptional(),
  filter: z.record(z.string(), z.unknown()).default(() => ({})),
});
