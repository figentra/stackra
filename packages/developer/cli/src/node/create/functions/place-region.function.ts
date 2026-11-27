/**
 * Stackra file contract:
 * Purpose: `placeRegion(source, region)`, a root runway's text with every environment placed in one resolved region:
 *          staging and production (and any environment that already names one) get `region: <key>`, every
 *          environment's `regions` deploy list becomes `[<key>]`, the root `regions` declares `<key>` with its cloud and
 *          location and drops the keys nothing lists any more, `targets.encore-cloud.cloud` follows the cloud, and the
 *          deprecated `providers.aws.region` follows the location (or goes, off AWS). Comments and the order of
 *          everything else are kept.
 * Boundary: pure; text in, text out. The region comes resolved (`resolveRegion`), so nothing here guesses a cloud. No
 *           account, project or credential is written: a Google Cloud app still names its project
 *           (`providers.gcp.projects`) before `runway validate` passes.
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3: create asks); ADR 0524 (amendment 2026-11-27, STA-2896: any provider
 *                     region); ADR 0354 (decision 4).
 */
import type { RunwayRegion } from "@stackra/runway";
import { isMap, isScalar, isSeq, parseDocument, type Document, type Pair } from "yaml";

/** The environments a product must place in a region (`checkEnvironmentRegion`). */
const PLACED: ReadonlySet<string> = new Set(["staging", "production"]);

/** A map pair's key as text. */
const keyOf = (pair: Pair): string => String(isScalar(pair.key) ? pair.key.value : pair.key);

/** The keys every environment's and dedicated deployment's `regions` list. */
function listedRegions(document: Document): Set<string> {
  const listed = new Set<string>();
  const add = (list: unknown) => {
    if (isSeq(list)) for (const item of list.toJSON() as unknown[]) listed.add(String(item));
  };
  const environments = document.get("environments");
  if (!isMap(environments)) return listed;
  for (const { value: environment } of environments.items) {
    if (!isMap(environment)) continue;
    add(environment.get("regions", true));
    const dedicated = environment.get("dedicated", true);
    if (isMap(dedicated))
      for (const { value: deployment } of dedicated.items)
        if (isMap(deployment)) add(deployment.get("regions", true));
  }
  return listed;
}

/**
 * The root runway `source` placed in `region`.
 *
 * @param source - the root runway's YAML text.
 * @param region - the resolved region (`resolveRegion`).
 * @example
 * placeRegion(text, { key: "us-east-1", cloud: "aws", location: "us-east-1" });
 * // "…\n  staging:\n    region: us-east-1\n    regions: [us-east-1]\n…"
 */
export function placeRegion(source: string, region: RunwayRegion): string {
  const document = parseDocument(source);
  const environments = document.get("environments");
  if (isMap(environments))
    for (const pair of environments.items) {
      const environment = pair.value;
      if (!isMap(environment)) continue;
      if (environment.has("region")) environment.set("region", region.key);
      else if (PLACED.has(keyOf(pair))) {
        // Beside the deploy list when there is one, else first: where a reader looks for it.
        const at = environment.items.findIndex((item) => keyOf(item) === "regions");
        environment.items.splice(Math.max(at, 0), 0, document.createPair("region", region.key));
      }
      const deploysTo = environment.get("regions", true);
      if (isSeq(deploysTo)) deploysTo.items = [document.createNode(region.key)];
    }

  const listed = listedRegions(document);
  if (listed.size > 0 || document.has("regions")) {
    const declared = document.get("regions", true);
    if (isMap(declared))
      declared.items = declared.items.filter((pair) => {
        const key = keyOf(pair);
        return key === region.key || listed.has(key);
      });
    document.setIn(["regions", region.key, "cloud"], region.cloud);
    document.setIn(["regions", region.key, "location"], region.location);
    if (region.jurisdiction === undefined)
      document.deleteIn(["regions", region.key, "jurisdiction"]);
    else document.setIn(["regions", region.key, "jurisdiction"], region.jurisdiction);
  }

  if (document.hasIn(["targets", "encore-cloud", "cloud"]))
    document.setIn(["targets", "encore-cloud", "cloud"], region.cloud);
  if (document.hasIn(["providers", "aws", "region"])) {
    if (region.cloud === "aws") document.setIn(["providers", "aws", "region"], region.location);
    else document.deleteIn(["providers", "aws", "region"]);
  }
  // `[me]`, not `[ me ]`: the starter writes its flow lists unpadded.
  return document.toString({ flowCollectionPadding: false });
}
