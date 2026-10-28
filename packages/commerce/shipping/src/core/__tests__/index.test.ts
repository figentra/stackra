/**
 * Stackra file contract:
 * Purpose: the contract of the `.` entry: exactly the functions, refusals and memory drivers at runtime, and that they compose: a
 *          quote's parcel weighed, a label checked and batched, events normalised.
 * Boundary: test only; imports the stand-in barrels through their `#core` and `#contracts` aliases and the runner
 *           through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0369.
 */
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat, TrackingState } from "#contracts/index";
import * as entry from "#core/index";

describe("@stackra/shipping", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "LabelDocumentInvalidError",
      "MemoryDistanceMatrixDriver",
      "MemoryRouteSolverDriver",
      "NoCarrierError",
      "batchZpl",
      "chargeableWeight",
      "dimensionalWeight",
      "hasCarrierCapability",
      "labelDocument",
      "normaliseTracking",
    ]);
  });

  it("weighs, labels and tracks a shipment", () => {
    const parcel = { lengthMm: 100, widthMm: 100, heightMm: 100, weightG: 100 };
    expect(entry.chargeableWeight(parcel, 1000, 1000)).toBe(1000);
    const label = entry.labelDocument(LabelFormat.Zpl, btoa("^XA^XZ"));
    expect(entry.batchZpl([label, label]).bytes.length).toBe(13);
    const timeline = entry.normaliseTracking([{ code: "D", at: "2026-10-25T08:00:00Z" }], {
      D: TrackingState.Delivered,
    });
    expect(timeline.state).toBe(TrackingState.Delivered);
  });
});
