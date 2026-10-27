/**
 * Stackra file contract:
 * Purpose: `C2PA_AI_IMAGE_STORE`, a c2pa-rs manifest store (`Reader#json()`) for a PNG a model generated, signed with
 *          a test certificate: the fixture the `credentialOf` and `c2pa` driver tests replay.
 * Boundary: test data only. Written from the C2PA 2.x specification and the c2pa-rs `ManifestStore` JSON shape, not
 *           captured from a signed file: re-record it with the issued certificate when the driver is certified (owner
 *           D3, certification pending).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-789.
 */

/** The active manifest's label. */
const LABEL = "urn:c2pa:3f2b9c7e-4a1d-4e8b-9c0f-5d6e7a8b9c0d";

/** The store of an AI-generated PNG that verifies. */
export const C2PA_AI_IMAGE_STORE = {
  active_manifest: LABEL,
  manifests: {
    [LABEL]: {
      claim_generator_info: [{ name: "figentra-ai/1.4 (image model)" }],
      title: "image.png",
      format: "image/png",
      instance_id: "xmp:iid:7d1c6a2e-0b3f-4c5d-8e9f-a0b1c2d3e4f5",
      assertions: [
        {
          label: "c2pa.actions.v2",
          data: {
            actions: [
              {
                action: "c2pa.created",
                digitalSourceType:
                  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                softwareAgent: { name: "figentra-ai/1.4 (image model)" },
                when: "2026-10-27T10:00:00.000Z",
              },
            ],
          },
        },
      ],
      signature_info: {
        alg: "Es256",
        issuer: "Stackra Test Signer",
        time: "2026-10-27T10:00:01+00:00",
      },
      label: LABEL,
    },
  },
  validation_state: "Valid",
} as const;
