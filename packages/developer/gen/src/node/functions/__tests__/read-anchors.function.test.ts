/**
 * Stackra file contract:
 * Purpose: unit tests of `readAnchors`: a JSX `anchor="..."` declares, an `anchor: "..."` property refers, each with its
 *          place; comment lines, test files, `data-anchor` attributes and generated or installed folders are skipped.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decisions 1 and 10); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";

import { readAnchors } from "#node/functions/read-anchors.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readAnchors", () => {
  it("separates the anchors a component declares from the ones source refers to", () => {
    const root = writeFixtureMember("console", {
      "src/routes/orders/orders.tsx": [
        'export const Page = () => <Button anchor="orders.export" data-anchor="not.this" />;',
        '// <Button anchor="commented.out" />',
        "export const Other = () => <Menu anchor={'orders.menu'} />;",
      ].join("\n"),
      "src/tours/welcome.ts":
        'export const steps = [{ tool: "ui.point", anchor: "orders.export" }, { anchor: "gone.key" }];\n',
      "src/routes/orders/__tests__/orders.test.tsx": '<Button anchor="in.tests" />\n',
      ".stackra/gen/x.ts": 'anchor: "generated"\n',
    });
    const { anchors, references } = readAnchors(root);
    expect(anchors.map(({ file, line, key }) => [file, line, key])).toEqual([
      ["src/routes/orders/orders.tsx", 1, "orders.export"],
      ["src/routes/orders/orders.tsx", 3, "orders.menu"],
    ]);
    expect(anchors[0]?.column).toBe(35);
    expect(references.map(({ file, line, key }) => [file, line, key])).toEqual([
      ["src/tours/welcome.ts", 1, "orders.export"],
      ["src/tours/welcome.ts", 1, "gone.key"],
    ]);
  });
});
