/**
 * Stackra file contract:
 * Purpose: unit tests of `plural`: the regular English rules for the last word of a snake_case name, and an already
 *          plural last word (`opening_hours`, `news`, `series`, `settings`, `analytics`) kept as it is.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 21).
 */
import { describe, expect, it } from "@stackra/testing";

import { plural } from "#core/functions/plural.function";

describe("plural", () => {
  it("applies the regular rules", () => {
    expect(plural("order")).toBe("orders");
    expect(plural("access_log_entry")).toBe("access_log_entries");
    expect(plural("box")).toBe("boxes");
    expect(plural("batch")).toBe("batches");
    expect(plural("key")).toBe("keys");
  });

  it.each([
    ["opening_hours", "opening_hours"],
    ["hours", "hours"],
    ["news", "news"],
    ["series", "series"],
    ["time_series", "time_series"],
    ["settings", "settings"],
    ["user_settings", "user_settings"],
    ["analytics", "analytics"],
    ["species", "species"],
    ["user_preferences", "user_preferences"],
  ])("keeps the already plural %s as %s", (name, table) => {
    expect(plural(name)).toBe(table);
  });

  it.each([
    ["address", "addresses"],
    ["class", "classes"],
    ["bus", "buses"],
    ["hour", "hours"],
    ["setting", "settings"],
    ["news_item", "news_items"],
  ])("still pluralises the regular %s as %s", (name, table) => {
    expect(plural(name)).toBe(table);
  });
});
