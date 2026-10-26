/**
 * Stackra file contract:
 * Purpose: `ENTRIES`, the package entries besides core `.`, in exports order (ADR 0294 decisions 15 and 23); `optional`
 *          entries are scaffolded only on request.
 * Boundary: data only; an entry is exported once its folder holds a file, and the barrels are generated.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 23).
 */

/**
 * Package entries besides core `.`, in exports order (ADR 0294 decisions 15 and 23). `optional` entries are scaffolded
 * only on request (`--entries react,native`); the others come with every package. An entry is exported once its folder
 * holds a file; the barrels are generated, never authored.
 */
export const ENTRIES = Object.freeze([
  {
    name: "contracts",
    optional: false,
    reason: "the leaf: `ports/`, `enums/` and `types/`; imports nothing else from the package",
    adr: "0294 d15",
  },
  {
    name: "node",
    optional: false,
    reason: "the module folder: the root module and the module groups",
    adr: "0294 d15",
  },
  { name: "react", optional: true, reason: "web renderers in `react/<name>/`", adr: "0294 d15" },
  {
    name: "native",
    optional: true,
    reason: "native renderers in `native/<name>/`",
    adr: "0294 d15",
  },
  {
    name: "testing",
    optional: false,
    reason: "`fakes/` and `matchers/` for consumers' tests",
    adr: "0294 d15",
  },
]);
