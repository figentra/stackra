/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPublicIdPrefixes`: different models in different members cannot share a prefix,
 *          hosted copies and same-member clashes are allowed, malformed inputs are ignored, findings are sorted and
 *          suggest a prefix no member uses.
 * Boundary: test only; pure. Every member, model and prefix here is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (public id prefixes and hosted models).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkPublicIdPrefixes } from "#node/functions/check-public-id-prefixes.function";

describe("checkPublicIdPrefixes", () => {
  it("reports two services sharing a prefix on different models, with both files and a free prefix", () => {
    expect(
      checkPublicIdPrefixes([
        {
          dir: "services/alpha",
          manifest: {
            models: [
              {
                key: "gadgets.gadget",
                file: "src/modules/gadgets/models/gadget.model.ts",
                publicId: "gad",
              },
            ],
          },
        },
        {
          dir: "services/beta",
          manifest: {
            models: [
              {
                key: "gadgeteers.gadgeteer",
                file: "src/modules/gadgeteers/models/gadgeteer.model.ts",
                publicId: "gad",
              },
            ],
          },
        },
      ]),
    ).toEqual([
      "public id prefix `gad` is used by gadgets.gadget (services/alpha/src/modules/gadgets/models/gadget.model.ts) and gadgeteers.gadgeteer (services/beta/src/modules/gadgeteers/models/gadgeteer.model.ts): give one of them another prefix, for example `gag` for gadgeteers.gadgeteer (ADR 0135)",
    ]);
  });

  it("suggests a prefix that no member uses", () => {
    const [finding] = checkPublicIdPrefixes([
      {
        dir: "services/alpha",
        manifest: { models: [{ key: "sprockets.sprocket", publicId: "spr" }] },
      },
      { dir: "services/beta", manifest: { models: [{ key: "sprouts.sprout", publicId: "spr" }] } },
      { dir: "services/gamma", manifest: { models: [{ key: "spools.spool", publicId: "spo" }] } },
    ]);
    // `spr` and `spo` are taken, so the suggestion for sprouts.sprout skips both.
    expect(finding).toContain("for example `spu` for sprouts.sprout");
  });

  it("accepts two services with distinct prefixes", () => {
    expect(
      checkPublicIdPrefixes([
        {
          dir: "services/alpha",
          manifest: { models: [{ key: "gadgets.gadget", publicId: "gad" }] },
        },
        {
          dir: "services/beta",
          manifest: { models: [{ key: "widgets.widget", publicId: "wid" }] },
        },
      ]),
    ).toEqual([]);
  });

  it.each([
    { key: "gadgets.gadget", from: "@stackra/gadgets", publicId: "gad" },
    { key: "kit.gadget", hosts: "gadgets.gadget", publicId: "gad" },
  ])("accepts two services hosting the same package model: %j", (model) => {
    expect(
      checkPublicIdPrefixes([
        {
          dir: "services/alpha",
          manifest: {
            models: [{ key: "gadgets.gadget", from: "@stackra/gadgets", publicId: "gad" }],
          },
        },
        { dir: "services/beta", manifest: { models: [model] } },
      ]),
    ).toEqual([]);
  });

  it("leaves clashes inside one member to gen", () => {
    expect(
      checkPublicIdPrefixes([
        {
          dir: "services/alpha",
          manifest: {
            models: [
              { key: "gadgets.gadget", publicId: "gad" },
              { key: "gadgeteers.gadgeteer", publicId: "gad" },
            ],
          },
        },
        {
          dir: "services/beta",
          manifest: { models: [{ key: "widgets.widget", publicId: "wid" }] },
        },
      ]),
    ).toEqual([]);
  });

  it("ignores entries without a string publicId", () => {
    expect(
      checkPublicIdPrefixes([
        {
          dir: "services/alpha",
          manifest: { models: [{ key: "gadgets.gadget", publicId: "gad" }] },
        },
        {
          dir: "services/beta",
          manifest: {
            models: [
              { key: "widgets.widget" },
              { key: "sprockets.sprocket", publicId: null },
              { key: "sprouts.sprout", publicId: 123 },
            ],
          },
        },
      ]),
    ).toEqual([]);
  });

  it("ignores malformed manifests and model entries", () => {
    expect(
      checkPublicIdPrefixes(
        [null, false, "manifest", [], {}, { models: {} }, { models: [null, 1, {}] }].map(
          (manifest) => ({ dir: "services/alpha", manifest }),
        ),
      ),
    ).toEqual([]);
  });

  it("returns one finding per prefix in prefix order and names every occurrence", () => {
    const members = ["services/first", "services/second", "apps/third"].map((dir, index) => ({
      dir,
      manifest: {
        models: [
          { key: `widgets.widget_${index}`, file: "src/models/widget.model.ts", publicId: "wid" },
          { key: `gadgets.gadget_${index}`, file: "src/models/gadget.model.ts", publicId: "gad" },
        ],
      },
    }));
    const findings = checkPublicIdPrefixes(members);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatch(
      /^public id prefix `gad` is used by gadgets\.gadget_0 \(services\/first\/src\/models\/gadget\.model\.ts\) and gadgets\.gadget_1 \(services\/second\/src\/models\/gadget\.model\.ts\) and gadgets\.gadget_2 \(apps\/third\/src\/models\/gadget\.model\.ts\): give one of them another prefix, for example `[a-z]{3,4}` for gadgets\.gadget_2 \(ADR 0135\)$/,
    );
    expect(findings[1]).toMatch(/^public id prefix `wid` is used by widgets\.widget_0 /);
  });
});
