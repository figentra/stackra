/**
 * Stackra file contract:
 * Purpose: `credentialOf`, the `ContentCredential` a C2PA manifest store (c2pa-rs `Reader#json()`) states, or `null`
 *          when it states none that verifies: the active manifest's claim generator, whether an action's digital
 *          source type is a trained model's, and when the image was made.
 * Boundary: pure. A store whose `validation_state` is `Invalid`, or that lists validation failures without a state,
 *           is `null`; so is one with no active manifest, no generator or no time. The time is the `c2pa.created`
 *           action's `when`, else the signature time. Trust in the signer's certificate authority is the reader's
 *           settings, not this function's.
 * Runtime: isomorphic
 * Governing contract: COM-73, COM-294; ADR 0245; C2PA 2.x; STA-789.
 */
import type { ContentCredential } from "#contracts/types/content-credential.type";
import { IPTC_SOURCE_TYPE } from "#node/constants/iptc-source-type.constant";
import type { C2paManifestStore } from "#node/types/c2pa-manifest-store.type";

/** The digital source types that mean a model made or edited the image. */
const AI_SOURCE_TYPES = new Set([
  `${IPTC_SOURCE_TYPE}trainedAlgorithmicMedia`,
  `${IPTC_SOURCE_TYPE}compositeWithTrainedAlgorithmicMedia`,
]);

/** One action of a `c2pa.actions` assertion. */
interface C2paAction {
  readonly action?: string;
  readonly digitalSourceType?: string;
  readonly when?: string;
}

/**
 * The credential `store` states, or `null`.
 *
 * @example
 * credentialOf(reader.json()); // { generator: "figentra-ai/1.4", aiGenerated: true, createdAt }
 */
export function credentialOf(store: C2paManifestStore): ContentCredential | null {
  if (store.validation_state === "Invalid") return null;
  if (store.validation_state === undefined && (store.validation_status?.length ?? 0) > 0)
    return null;
  const manifest =
    store.active_manifest === undefined ? undefined : store.manifests?.[store.active_manifest];
  if (manifest === undefined) return null;

  const generator = manifest.claim_generator_info?.[0]?.name ?? manifest.claim_generator;
  const actions = (manifest.assertions ?? [])
    .filter((assertion) => assertion.label?.startsWith("c2pa.actions") === true)
    .flatMap(
      (assertion) => (assertion.data as { actions?: C2paAction[] } | undefined)?.actions ?? [],
    );
  const created = actions.find((action) => action.action === "c2pa.created");
  const createdAt = new Date(created?.when ?? manifest.signature_info?.time ?? Number.NaN);
  if (generator === undefined || generator === "" || Number.isNaN(createdAt.getTime())) return null;

  return {
    generator,
    aiGenerated: actions.some((action) => AI_SOURCE_TYPES.has(action.digitalSourceType ?? "")),
    createdAt,
  };
}
