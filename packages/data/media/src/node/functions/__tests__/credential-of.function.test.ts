/**
 * Stackra file contract:
 * Purpose: unit tests of `credentialOf`: the recorded AI-image store read as a credential, and `null` for a store that
 *          does not verify, has no active manifest, no generator or no time; the signature time as a fallback.
 * Boundary: test only; pure, over the recorded fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-789.
 */
import { describe, expect, it } from "@stackra/testing";

import { C2PA_AI_IMAGE_STORE } from "#node/functions/__tests__/c2pa-store.fixture";
import { credentialOf } from "#node/functions/credential-of.function";

const LABEL = C2PA_AI_IMAGE_STORE.active_manifest;
const MANIFEST = C2PA_AI_IMAGE_STORE.manifests[LABEL];

describe("credentialOf", () => {
  it("reads the recorded AI-image store", () => {
    expect(credentialOf(C2PA_AI_IMAGE_STORE)).toEqual({
      generator: "figentra-ai/1.4 (image model)",
      aiGenerated: true,
      createdAt: new Date("2026-10-27T10:00:00.000Z"),
    });
  });

  it("is null when the store does not verify", () => {
    expect(credentialOf({ ...C2PA_AI_IMAGE_STORE, validation_state: "Invalid" })).toBeNull();
    const { validation_state: _, ...stateless } = C2PA_AI_IMAGE_STORE;
    expect(
      credentialOf({ ...stateless, validation_status: [{ code: "claimSignature.mismatch" }] }),
    ).toBeNull();
  });

  it("is null without an active manifest, a generator or a time", () => {
    expect(credentialOf({ manifests: C2PA_AI_IMAGE_STORE.manifests })).toBeNull();
    expect(
      credentialOf({
        active_manifest: LABEL,
        manifests: { [LABEL]: { ...MANIFEST, claim_generator_info: [] } },
      }),
    ).toBeNull();
    expect(
      credentialOf({
        active_manifest: LABEL,
        manifests: { [LABEL]: { claim_generator_info: [{ name: "x" }], assertions: [] } },
      }),
    ).toBeNull();
  });

  it("falls back to the signature time and reads a model-free image", () => {
    expect(
      credentialOf({
        active_manifest: LABEL,
        manifests: {
          [LABEL]: {
            claim_generator_info: [{ name: "camera" }],
            assertions: [
              {
                label: "c2pa.actions",
                data: { actions: [{ action: "c2pa.edited" }] },
              },
            ],
            signature_info: { time: "2026-10-27T10:00:01+00:00" },
          },
        },
      }),
    ).toEqual({
      generator: "camera",
      aiGenerated: false,
      createdAt: new Date("2026-10-27T10:00:01Z"),
    });
  });
});
