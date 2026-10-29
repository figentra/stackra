/**
 * Stackra file contract:
 * Purpose: `GENERATED_QUERY_SCHEMAS`, the JSON Schemas of the input and output of the queries gen writes itself:
 *          `SearchQueryInput` and `SearchQueryOutput` of `@stackra/search` (a `@Searchable` model's search query) and
 *          `ReportRequest` and `ReportResult` of `@stackra/reports` (a report's query), keyed by shape name.
 * Boundary: a constant; the manifest writes each one a generated query of a module names under `schemas` as
 *           `<module>.<name>`, so the MCP tool, the OpenAPI document and the generated clients see its fields (STA-1459).
 *           It mirrors those package shapes; a change to either changes this.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 6: `SearchQuery`); ADR 0470 (decision 3: `ReportRequest`, `ReportResult`);
 *                     ADR 0294 (decision 26).
 */
import type { Json } from "@stackra/contracts";

/** A JSON object whose values are any JSON. */
const ANY_RECORD: Json = { type: "object", additionalProperties: {} };

/** A list of strings. */
const STRINGS: Json = { type: "array", items: { type: "string" } };

/** The wire shapes of the generated search and report queries, by shape name. */
export const GENERATED_QUERY_SCHEMAS: Readonly<Record<string, Json>> = {
  SearchQueryInput: {
    type: "object",
    required: ["q"],
    properties: {
      q: { type: "string", minLength: 1, maxLength: 200 },
      limit: { type: "integer", minimum: 1, maximum: 50 },
      arabizi: { type: "boolean" },
    },
  },
  SearchQueryOutput: {
    type: "object",
    required: ["hits"],
    properties: {
      hits: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "title"],
          properties: {
            id: { type: "string", minLength: 1 },
            title: { type: "string" },
            snippet: { type: "string" },
          },
        },
      },
    },
  },
  ReportRequest: {
    type: "object",
    required: ["dimensions", "measures"],
    properties: {
      dimensions: {
        type: "array",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            grain: { type: "string", enum: ["hour", "day", "week", "month", "quarter", "year"] },
          },
        },
      },
      measures: { type: "array", minItems: 1, items: { type: "string" } },
      filters: ANY_RECORD,
      sort: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          required: ["key", "direction"],
          properties: {
            key: { type: "string" },
            direction: { type: "string", enum: ["asc", "desc"] },
          },
        },
      },
      limit: { type: "integer", minimum: 1 },
      cursor: { type: "string" },
      subtotals: { type: "boolean" },
      pivot: {
        type: "object",
        required: ["rows", "columns"],
        properties: { rows: STRINGS, columns: STRINGS },
      },
    },
  },
  ReportResult: {
    type: "object",
    required: ["rows", "totals", "cursor"],
    properties: {
      rows: { type: "array", items: ANY_RECORD },
      totals: ANY_RECORD,
      cursor: { type: ["string", "null"] },
      subtotals: { type: "array", items: ANY_RECORD },
      pivot: ANY_RECORD,
    },
  },
};
