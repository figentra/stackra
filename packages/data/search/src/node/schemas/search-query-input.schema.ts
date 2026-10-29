/**
 * Stackra file contract:
 * Purpose: `SearchQueryInput`, the input of a model's generated search query (`<model>.search`): the phrase, how many
 *          hits at most and whether an Arabizi word also matches its Arabic spelling.
 * Boundary: a shape class in its own file. The scope, the caller and the locale are the call's, never input; filters
 *           stay server-side (a hand-written query passes them). It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one
 *                     declaration per file).
 */
import { Int, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** The rules of the input. */
const SEARCH_QUERY_INPUT_SCHEMA = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
  arabizi: z.boolean().optional(),
});

/**
 * What one search asks for.
 *
 * @example
 * SearchQueryInput.create({ q: "linen shirt", limit: 8 });
 */
export class SearchQueryInput extends Schema {
  /** The phrase as typed, 1 to 200 characters. */
  @Str({
    min: 1,
    max: 200,
  })
  q!: string;

  /** How many hits at most, 1 to 50; 10 when absent. */
  @Int({
    min: 1,
    max: 50,
  })
  limit?: number;

  /** Whether an Arabizi word also matches its Arabic spelling; on when absent. */
  arabizi?: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[SearchQueryInput, SEARCH_QUERY_INPUT_SCHEMA]]);
