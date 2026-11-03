/**
 * Stackra file contract:
 * Purpose: `anonymousSurfacesOf(manifest)`, the locked keys of a member's own actions and queries an anonymous caller
 *          may call (`anonymous: true`, or `actors` listing `anonymous` in an older manifest): the calls that pass the
 *          permission and record-policy steps for a caller with no session, so `stackra check` lists them and a new one
 *          shows in review.
 * Boundary: pure; reads one parsed manifest. A hosted package's rows (`from`) are its own manifest's, so each anonymous
 *           call is listed once, by its owner.
 * Runtime: node
 * Governing contract: ADR 0098 (the pipeline); ADR 0082 (public calls); STA-2025.
 */

/**
 * The anonymous-callable keys of `manifest`, sorted.
 *
 * @example
 * anonymousSurfacesOf(identityManifest); // ["identity.passkey.challenge@1", "identity.passkey.verify@1"]
 */
export function anonymousSurfacesOf(manifest: {
  readonly actions?: readonly Readonly<Record<string, unknown>>[];
}): string[] {
  return (
    (manifest.actions ?? [])
      .filter(
        (entry) =>
          entry["from"] === undefined &&
          (entry["anonymous"] === true ||
            (Array.isArray(entry["actors"]) && entry["actors"].includes("anonymous"))),
      )
      .map((entry) => String(entry["key"]))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}
