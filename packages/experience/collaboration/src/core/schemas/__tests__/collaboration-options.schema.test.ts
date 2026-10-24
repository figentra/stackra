/**
 * Stackra file contract:
 * Purpose: unit tests of `CollaborationOptions`: a shape whose initializers equal the shipped schema's defaults and
 *          whose registered schema is `COLLABORATION_CONFIG_SCHEMA`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { COLLABORATION_CONFIG_SCHEMA } from "#core/constants/collaboration-config-schema.constant";
import { CollaborationOptions } from "#core/schemas/collaboration-options.schema";

describe("CollaborationOptions", () => {
  it("is a shape whose initializers are the shipped defaults", () => {
    const options = new CollaborationOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(COLLABORATION_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(CollaborationOptions)).toBe(COLLABORATION_CONFIG_SCHEMA);
  });
});
