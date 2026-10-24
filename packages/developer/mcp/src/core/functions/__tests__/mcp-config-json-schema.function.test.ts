/**
 * Stackra file contract:
 * Purpose: unit tests of `mcpConfigJsonSchema`: a draft 2020-12 schema with the static host's `$id`, requiring
 *          `mcpServers` and refusing unknown top-level keys.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 9); ADR 0284.
 */
import { describe, expect, it } from "@stackra/testing";

import { mcpConfigJsonSchema } from "#core/functions/mcp-config-json-schema.function";

describe("mcpConfigJsonSchema", () => {
  it("describes .mcp.yaml for the editor", () => {
    const schema = mcpConfigJsonSchema();
    expect(schema.$id).toBe("https://static.stackra.figentra.com/schemas/mcp.json");
    expect(schema["$schema"]).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema["required"]).toEqual(["mcpServers"]);
    expect(schema["additionalProperties"]).toBe(false);
  });
});
