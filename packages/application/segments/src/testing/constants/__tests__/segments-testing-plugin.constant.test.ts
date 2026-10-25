/**
 * Stackra file contract:
 * Purpose: unit tests of `SEGMENTS_TESTING_PLUGIN`: on compile it connects the app's `SegmentService` to the app, leaves
 *          an app that binds none alone, and adds no member.
 * Boundary: test only; the testing app is an in-test fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SegmentService } from "#node/index";
import { SEGMENTS_TESTING_PLUGIN } from "#testing/constants/segments-testing-plugin.constant";

describe("SEGMENTS_TESTING_PLUGIN", () => {
  it("connects the app's segment service to the app", () => {
    const service = { connect: vi.fn() };
    const app = { has: vi.fn(() => true), get: vi.fn(() => service) };
    expect(SEGMENTS_TESTING_PLUGIN.name).toBe("@stackra/segments");
    expect(SEGMENTS_TESTING_PLUGIN.app?.(app as unknown as TestingApp)).toEqual({});
    expect(app.has).toHaveBeenCalledWith(SegmentService);
    expect(service.connect).toHaveBeenCalledWith(app);
  });

  it("leaves an app that binds no segment service", () => {
    const app = { has: vi.fn(() => false), get: vi.fn() };
    SEGMENTS_TESTING_PLUGIN.app?.(app as unknown as TestingApp);
    expect(app.get).not.toHaveBeenCalled();
  });
});
