/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./desktop` entry: the keychain payload seal is exported and nothing else is.
 * Boundary: test only; `electron` is replaced, since a library never runs the binary.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as desktop from "#desktop/index";

vi.mock("electron", () => ({ safeStorage: {} }));

describe("@stackra/storage/desktop", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(desktop).sort()).toEqual(["SafeStoragePayloadSealDriver"]);
  });
});
