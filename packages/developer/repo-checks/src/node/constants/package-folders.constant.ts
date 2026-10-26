/**
 * Stackra file contract:
 * Purpose: `PACKAGE_FOLDERS`, the folders of a package's `src/` (ADR 0294 decision 15) and the subpath each feeds.
 * Boundary: data only. Dependencies run one way: core imports contracts; node, react and native import core; testing
 *           imports them all.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 19); the STA-347 decision on config beside core.
 */

/**
 * The folders of a package's `src/` (ADR 0294 decision 15) and the subpath each feeds. `.` exports `config/` beside
 * `core/`, so a host can subclass a package's config class (ADR 0294 decision 19; the STA-347 decision on the question
 * the ADR 0177 amendment left open).
 */
export const PACKAGE_FOLDERS = Object.freeze(
  (
    [
      ["contracts", "./contracts", "the leaf: `ports/`, `enums/` and `types/`"],
      ["config", ".", "the config classes, which a host subclasses to override"],
      ["core", ".", "isomorphic code: services, drivers, errors, functions, schemas and blocks"],
      ["node", "./node", "the module folder: `<key>.module.ts` and the module groups"],
      ["react/<name>", "./react", "web renderers"],
      ["native/<name>", "./native", "native renderers"],
      ["testing", "./testing", "`fakes/` and `matchers/`"],
    ] as const
  ).map(([folder, entry, reason]) => ({ folder, entry, reason, adr: "0294 d15" })),
);
