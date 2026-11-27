/**
 * Stackra file contract:
 * Purpose: `REGION_PRESETS`, the cloud, cloud region and jurisdiction of each named region preset (`RegionKey`):
 *          `me` is AWS me-central-1 (UAE), `eu` is AWS eu-central-1 (Frankfurt) and `ksa` is Google Cloud me-central2
 *          (Dammam). An environment's `region` names a preset, a key of the root `regions`, or a provider region id
 *          (`resolveRegion`).
 * Boundary: data only. The account or project of a preset stays figentra/infra's (`ref:aws.account`, ADR 0524); a
 *           new preset needs an OS 0001 amendment. Any other provider region needs no preset.
 * Runtime: isomorphic
 * Governing contract: OS ADR 0001 (tenant regions); ADR 0524 (amendment 2026-11-27, STA-2896); ADR 0354 (decision 4).
 */
import { RegionKey } from "#core/enums/region-key.enum";
import { RunwayCloud } from "#core/enums/runway-cloud.enum";

/** One preset: where it runs and the jurisdiction its data stays in. */
type RegionPreset = {
  readonly cloud: RunwayCloud;
  readonly location: string;
  readonly jurisdiction: string;
};

/** Each preset key to the cloud region it stands for. */
export const REGION_PRESETS: Readonly<Record<RegionKey, RegionPreset>> = Object.freeze({
  [RegionKey.Me]: { cloud: RunwayCloud.Aws, location: "me-central-1", jurisdiction: "ae" },
  [RegionKey.Eu]: { cloud: RunwayCloud.Aws, location: "eu-central-1", jurisdiction: "eu" },
  [RegionKey.Ksa]: { cloud: RunwayCloud.Gcp, location: "me-central2", jurisdiction: "sa" },
});
