/**
 * Stackra file contract:
 * Purpose: `resolveRegion(root, name)`, the cloud region a region name stands for: a key the root runway declares in
 *          `regions` first, then a named preset (`me`, `eu`, `ksa`, `REGION_PRESETS`), then an AWS region id
 *          (`us-east-1`, `ap-south-1`, `us-gov-west-1`) or a Google Cloud one (`us-central1`, `europe-west1`), each of
 *          which is its own location.
 * Boundary: pure; reads only `root.regions`. A name that is none of these resolves to `undefined`, which
 *           `checkEnvironmentRegion` reports. Nothing is contacted: whether the account has the region enabled is the
 *           provider's answer at deploy time.
 * Runtime: isomorphic
 * Governing contract: ADR 0524 (amendment 2026-11-27, STA-2896); ADR 0354 (decision 4); OS ADR 0001 (tenant regions).
 */
import { REGION_PRESETS } from "#core/constants/region-presets.constant";
import { RunwayCloud } from "#core/enums/runway-cloud.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayRegion } from "#core/types/runway-region.type";

/** The compass part every AWS and Google Cloud region id carries. */
const DIRECTION = "(?:north|south|east|west|central|northeast|northwest|southeast|southwest)";

/** An AWS region id: `<area>-[<partition>-]<direction>-<n>`, the number after a dash. */
const AWS_REGION = new RegExp(
  `^(?:af|ap|ca|cn|eu|il|me|mx|sa|us)-(?:gov-|iso-|isob-|isoe-|isof-)?${DIRECTION}-[0-9]{1,2}$`,
);

/** A Google Cloud region id: `<continent>-<direction><n>`, the number straight after the direction. */
const GCP_REGION = new RegExp(
  `^(?:africa|asia|australia|europe|me|northamerica|southamerica|us)-${DIRECTION}[0-9]{1,2}$`,
);

/**
 * The region `name` stands for in `root`, `undefined` when it is neither declared, a preset nor a provider region id.
 *
 * @param root - the parsed root runway, or only its `regions` (`{}` resolves presets and provider ids alone).
 * @param name - an environment's `region`.
 * @example
 * resolveRegion(root, "us-east-1");
 * // { key: "us-east-1", cloud: "aws", location: "us-east-1" }
 * resolveRegion({}, "ksa");
 * // { key: "ksa", cloud: "gcp", location: "me-central2", jurisdiction: "sa" }
 */
export function resolveRegion(
  root: Pick<RootRunway, "regions">,
  name: string,
): RunwayRegion | undefined {
  const regions = root.regions ?? {};
  if (Object.hasOwn(regions, name)) {
    const { cloud, location, account, jurisdiction } = regions[name] as NonNullable<
      RootRunway["regions"]
    >[string];
    return {
      key: name,
      cloud,
      location,
      ...(account !== undefined && { account }),
      ...(jurisdiction !== undefined && { jurisdiction }),
    };
  }
  if (Object.hasOwn(REGION_PRESETS, name))
    return { key: name, ...REGION_PRESETS[name as keyof typeof REGION_PRESETS] };
  if (AWS_REGION.test(name)) return { key: name, cloud: RunwayCloud.Aws, location: name };
  if (GCP_REGION.test(name)) return { key: name, cloud: RunwayCloud.Gcp, location: name };
  return undefined;
}
