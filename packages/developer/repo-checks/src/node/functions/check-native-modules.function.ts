/**
 * Stackra file contract:
 * Purpose: `checkNativeModules(files, filesOf)`, ADR 0478: an app holds no hand-written Swift, Kotlin, Java or
 *          Objective-C outside its generated `ios/` and `android/`, and a package with `expo-module.config.json` has
 *          `src/`, `plugin/` and `ios/` or `android/` in the repository and lists them and the config in `files`.
 * Boundary: pure over the repository file list; `filesOf` reads a package's `files` allow list.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2, 3 and 7).
 */

/** Native source a hand writes. */
const NATIVE_SOURCE = /\.(?:swift|kt|java|m|mm)$/;

/** shortcut: the mobile app's customer display predates ADR 0478; drop this when STA-1533 moves it to a package. */
const NATIVE_SOURCES_PENDING = /^apps\/mobile\/src\/native-sources\/customer-display\//;

/** A module package: `packages/<category>/<name>/expo-module.config.json`. */
const MODULE_CONFIG = /^(packages\/[^/]+\/[^/]+)\/expo-module\.config\.json$/;

/**
 * The native-module findings of the repository.
 *
 * @param files - every repository-relative file git lists.
 * @param filesOf - a package's `files` allow list, by its folder.
 * @example
 * checkNativeModules(["apps/m/src/x.swift"], () => undefined); // one finding
 */
export function checkNativeModules(
  files: readonly string[],
  filesOf: (dir: string) => readonly string[] | undefined,
): string[] {
  const out: string[] = [];
  for (const file of files) {
    const app = /^apps\/[^/]+\/(.+)$/.exec(file)?.[1];
    if (
      app !== undefined &&
      NATIVE_SOURCE.test(file) &&
      !/^(?:ios|android)\//.test(app) &&
      !NATIVE_SOURCES_PENDING.test(file)
    )
      out.push(`${file}: hand-written native code belongs in an Expo module package (ADR 0478)`);
  }
  for (const file of files) {
    const dir = MODULE_CONFIG.exec(file)?.[1];
    if (dir === undefined) continue;
    const has = (folder: string): boolean => files.some((f) => f.startsWith(`${dir}/${folder}/`));
    const present = ["src", "plugin", "ios", "android"].filter(has);
    for (const folder of ["src", "plugin"])
      if (!present.includes(folder))
        out.push(`${dir}: an Expo module package has ${folder}/ (ADR 0478)`);
    if (!present.includes("ios") && !present.includes("android"))
      out.push(`${dir}: an Expo module package has ios/ or android/ in git (ADR 0478)`);
    const listed = filesOf(dir) ?? [];
    for (const name of [...present.filter((folder) => folder !== "src"), "expo-module.config.json"])
      if (!listed.some((entry) => entry === name || entry.startsWith(`${name}/`)))
        out.push(`${dir}: package.json "files" does not list ${name} (ADR 0478 decision 7)`);
  }
  return out;
}
