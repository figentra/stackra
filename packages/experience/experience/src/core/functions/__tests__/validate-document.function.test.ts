/**
 * Stackra file contract:
 * Purpose: unit tests of `validateDocument`, the server-side validator: a valid email template passes; a page block in
 *          an email template, an unknown key, refused props (by path, never value), a stray key, a repeated id, a
 *          malformed node and the depth and size bounds are each reported at their path; `null` is empty; nothing
 *          throws on the document.
 * Boundary: test only; the blocks' schemas are registered by hand in the form gen compiles them. No component is
 *           registered: the validator needs none.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0110 (decision 4); ADR 0270 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import { validateDocument } from "#core/functions/validate-document.function";
import type { BlockClass } from "#core/types/block-class.type";

class EmailSectionBlock extends Block({
  category: BlockCategory.Layout,
  icon: "layout-grid",
  kinds: [ExperienceKind.EmailTemplate, ExperienceKind.Page],
}) {}

class EmailTextBlock extends Block({
  category: BlockCategory.Content,
  icon: "type",
  kinds: [ExperienceKind.EmailTemplate],
}) {
  text!: string;
}

class HeroBlock extends Block({
  category: BlockCategory.Marketing,
  icon: "sparkles",
}) {}

registerSchemas([
  [EmailSectionBlock, z.object({})],
  [EmailTextBlock, z.object({ text: z.string().min(1) })],
  [HeroBlock, z.object({})],
]);

const blocks = new Map<string, BlockClass>([
  ["mail.section", EmailSectionBlock],
  ["mail.text", EmailTextBlock],
  ["web.hero", HeroBlock],
]);

const email = { kind: ExperienceKind.EmailTemplate, blocks };

describe("validateDocument", () => {
  it("passes a valid email template and an empty document", () => {
    expect(
      validateDocument(
        {
          id: "b0",
          block: "mail.section",
          children: [{ id: "b1", block: "mail.text", props: { text: "Your order shipped" } }],
        },
        email,
      ),
    ).toEqual([]);
    expect(validateDocument(null, email)).toEqual([]);
  });

  it("reports a block outside the kind, an unknown key and refused props by path", () => {
    expect(
      validateDocument(
        [
          { block: "web.hero" },
          { block: "mail.ghost" },
          { block: "mail.text", props: { text: "" } },
        ],
        email,
      ),
    ).toEqual([
      { path: "0", code: "kind_not_allowed", block: "web.hero" },
      { path: "1", code: "unknown_block", block: "mail.ghost" },
      { path: "2", code: "invalid_props", block: "mail.text", props: ["text"] },
    ]);
  });

  it("reports malformed nodes, stray keys and repeated ids", () => {
    expect(
      validateDocument(
        {
          block: "mail.section",
          children: [
            "text",
            { block: "mail.section", script: "alert(1)" },
            { id: "x", block: "mail.section" },
            { id: "x", block: "mail.section" },
          ],
        },
        email,
      ),
    ).toEqual([
      { path: "0.children.0", code: "invalid_node" },
      { path: "0.children.1", code: "invalid_node", block: "mail.section" },
      { path: "0.children.3", code: "duplicate_id", block: "mail.section" },
    ]);
  });

  it("holds the depth and size bounds", () => {
    const deep = {
      block: "mail.section",
      children: [{ block: "mail.section", children: [{ block: "mail.section" }] }],
    };
    expect(validateDocument(deep, { ...email, maxDepth: 2 })).toEqual([
      { path: "0.children.0.children.0", code: "too_deep" },
    ]);
    expect(validateDocument(deep, { ...email, maxBlocks: 2 })).toEqual([
      { path: "", code: "too_many_blocks" },
    ]);
  });
});
