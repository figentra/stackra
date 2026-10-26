/**
 * Stackra file contract:
 * Purpose: unit tests of `WORKFLOW_TEMPLATE_PACK_SCHEMA`: it parses a versioned pack of automation templates, keeping
 *          each template whole, and refuses a bad version and two templates with one key.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; config-model sections 5 and 6.
 */
import { describe, expect, it } from "@stackra/testing";

import { WORKFLOW_TEMPLATE_PACK_SCHEMA } from "#core/constants/workflow-template-pack-schema.constant";

const TEMPLATE = { key: "commerce.cod_confirmation", steps: [{ name: "ask", block: "sms.send" }] };

/** Whether `pack` is a valid template pack. */
const parses = (pack: unknown): boolean => WORKFLOW_TEMPLATE_PACK_SCHEMA.safeParse(pack).success;

describe("WORKFLOW_TEMPLATE_PACK_SCHEMA", () => {
  it("parses a pack and keeps each template whole", () => {
    const pack = WORKFLOW_TEMPLATE_PACK_SCHEMA.parse({
      key: "commerce",
      version: "1.0.0",
      templates: [TEMPLATE],
    });
    expect(pack.templates[0]).toEqual(TEMPLATE);
  });

  it("refuses a bad version and a repeated template", () => {
    expect(parses({ key: "commerce", version: "1", templates: [] })).toBe(false);
    expect(parses({ key: "commerce", version: "1.0.0", templates: [TEMPLATE, TEMPLATE] })).toBe(
      false,
    );
  });
});
