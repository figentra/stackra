/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: every value the template imports from `@stackra/panel/react` is
 *          exported, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
// @vitest-environment jsdom
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/panel/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "ActionRunStatus",
      "Dashboard",
      "PanelShell",
      "WidgetTile",
      "useActionRunner",
      "useBreadcrumb",
      "useBreadcrumbs",
      "usePanel",
    ]);
  });
});
