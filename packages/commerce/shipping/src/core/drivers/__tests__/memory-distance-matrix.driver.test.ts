/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDistanceMatrixDriver`: it is a `DistanceMatrix`, answers known legs in origin and
 *          destination order, a point to itself as 0, and an unknown pair as unreachable rather than a guess.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0269; R3-SO-09.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DistanceMatrix } from "#contracts/ports/distance-matrix.port";
import { MemoryDistanceMatrixDriver } from "#core/drivers/memory-distance-matrix.driver";

const store = { latitude: 1, longitude: 1 };
const door = { latitude: 2, longitude: 2 };
const far = { latitude: 3, longitude: 3 };

describe("MemoryDistanceMatrixDriver", () => {
  it("is the DistanceMatrix port", () => {
    expect(Object.getPrototypeOf(DistanceMatrix)).toBe(Port);
    expect(new MemoryDistanceMatrixDriver()).toBeInstanceOf(DistanceMatrix);
  });

  it("answers known legs, itself as 0 and unknown pairs as null", async () => {
    const distances = new MemoryDistanceMatrixDriver();
    distances.legs.push({ from: store, to: door, durationS: 600, distanceM: 4000 });
    expect(
      await distances.matrix({ origins: [store, door], destinations: [door, far, store] }),
    ).toEqual({
      durationsS: [
        [600, null, 0],
        [0, null, null],
      ],
      distancesM: [
        [4000, null, 0],
        [0, null, null],
      ],
    });
  });
});
