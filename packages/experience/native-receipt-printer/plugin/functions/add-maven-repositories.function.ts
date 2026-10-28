/**
 * Stackra file contract:
 * Purpose: `addMavenRepositories`, which adds vendor Maven repositories to the `allprojects { repositories { ... } }`
 *          block of the app's generated `android/build.gradle`, so Gradle fetches a vendor SDK from the vendor.
 * Boundary: internal; pure text edit of the Groovy file. A URL already present is not added again; a file without an
 *           `allprojects` repositories block is returned unchanged (the build then fails on the missing artefact,
 *           loudly). Only `https` URLs are accepted.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 4: SDKs fetched from the vendor's repository at build time).
 */

/** The opening of the generated file's project-wide repositories block. */
const ALL_PROJECTS = /allprojects\s*\{\s*repositories\s*\{/;

/**
 * `buildGradle` with each of `urls` listed as a Maven repository.
 *
 * @example
 * addMavenRepositories(contents, ["https://maven.vendor.example/releases"]);
 */
export function addMavenRepositories(buildGradle: string, urls: readonly string[]): string {
  const missing = urls.filter((url) => {
    if (!url.startsWith("https://"))
      throw new Error(`@stackra/native-receipt-printer: repository "${url}" is not https`);
    return !buildGradle.includes(url);
  });
  if (missing.length === 0) return buildGradle;
  const lines = missing.map((url) => `\n    maven { url "${url}" }`).join("");
  return buildGradle.replace(ALL_PROJECTS, (opening) => `${opening}${lines}`);
}
