/**
 * Stackra file contract:
 * Purpose: `c2paManifestOf`, the C2PA manifest definition (c2pa-rs `ManifestDefinition` JSON) that states a
 *          `ContentCredential`: the claim generator and one `c2pa.created` action carrying the IPTC digital source
 *          type (`trainedAlgorithmicMedia` for a model's image) and the time it was made.
 * Boundary: pure; data only, no signing. Field names are the C2PA 2.x specification's (`c2pa.actions.v2`,
 *           `digitalSourceType`, `when`, `softwareAgent`). An image that is not AI-generated is stated as
 *           `digitalCreation`, made with software.
 * Runtime: isomorphic
 * Governing contract: COM-73, COM-294; ADR 0245 (AI outputs); C2PA 2.x actions assertion; STA-789.
 */
import type { ContentCredential } from "#contracts/types/content-credential.type";
import { IPTC_SOURCE_TYPE } from "#node/constants/iptc-source-type.constant";
import type { C2paManifestDefinition } from "#node/types/c2pa-manifest-definition.type";

/**
 * The manifest definition stating `credential` for an image of `format`.
 *
 * @example
 * c2paManifestOf({ generator: "figentra-ai/1.4", aiGenerated: true, createdAt }, "image/png");
 */
export function c2paManifestOf(
  credential: ContentCredential,
  format: string,
): C2paManifestDefinition {
  return {
    claim_generator_info: [{ name: credential.generator }],
    format,
    assertions: [
      {
        label: "c2pa.actions.v2",
        data: {
          actions: [
            {
              action: "c2pa.created",
              digitalSourceType: `${IPTC_SOURCE_TYPE}${credential.aiGenerated ? "trainedAlgorithmicMedia" : "digitalCreation"}`,
              softwareAgent: { name: credential.generator },
              when: credential.createdAt.toISOString(),
            },
          ],
        },
      },
    ],
  };
}
