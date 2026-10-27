/**
 * Stackra file contract:
 * Purpose: unit tests of `c2paManifestOf`: the generator, the `c2pa.created` action with the trained-model source type
 *          and its time, `digitalCreation` for an image no model made, and a round trip through `credentialOf`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-789.
 */
import { describe, expect, it } from "@stackra/testing";

import { c2paManifestOf } from "#node/functions/c2pa-manifest-of.function";
import { credentialOf } from "#node/functions/credential-of.function";

const credential = {
  generator: "figentra-ai/1.4",
  aiGenerated: true,
  createdAt: new Date("2026-10-27T10:00:00Z"),
};

describe("c2paManifestOf", () => {
  it("states the generator, the trained-model source type and the time", () => {
    expect(c2paManifestOf(credential, "image/png")).toEqual({
      claim_generator_info: [{ name: "figentra-ai/1.4" }],
      format: "image/png",
      assertions: [
        {
          label: "c2pa.actions.v2",
          data: {
            actions: [
              {
                action: "c2pa.created",
                digitalSourceType:
                  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                softwareAgent: { name: "figentra-ai/1.4" },
                when: "2026-10-27T10:00:00.000Z",
              },
            ],
          },
        },
      ],
    });
  });

  it("states digitalCreation for an image no model made", () => {
    const manifest = c2paManifestOf({ ...credential, aiGenerated: false }, "image/jpeg");
    expect(manifest.assertions[0]?.data.actions[0]?.digitalSourceType).toBe(
      "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCreation",
    );
  });

  it("reads back through credentialOf", () => {
    const manifest = c2paManifestOf(credential, "image/png");
    expect(
      credentialOf({ active_manifest: "m", manifests: { m: manifest }, validation_state: "Valid" }),
    ).toEqual(credential);
  });
});
