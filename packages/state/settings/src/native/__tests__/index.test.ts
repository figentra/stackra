/**
 * Stackra file contract:
 * Purpose: barrel test of the `./native` entry: exactly the form.
 * Boundary: test only. React Native does not load in vitest, so `react-native` and `@stackra/ui/native` are replaced
 *           by empty stand-ins; only the exports are checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("react-native", () => ({ View: () => null }));
vi.mock("@stackra/ui/native", () => ({ Switch: () => null, TextField: () => null }));

describe("@stackra/settings/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["SettingsForm"]);
  });
});
