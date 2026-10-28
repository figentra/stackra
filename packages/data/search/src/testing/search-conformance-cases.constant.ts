/**
 * Stackra file contract:
 * Purpose: `SEARCH_CONFORMANCE_CASES`, the rules of the `SearchDriver` port as runnable cases: every word required,
 *          word prefixes, alternatives, exact filters, offset and limit, facet counts, re-indexing replaces, removal,
 *          refusing record visibility an engine cannot apply, and scope isolation of matches and facet counts.
 * Boundary: test code only, in the `./testing` entry, vendor-neutral. A case gets a fresh driver and its own table,
 *           indexes `SEARCH_CONFORMANCE_DOCUMENTS` there first, and returns the rules missed. Ranking order between
 *           matching rows is the engine's, so cases compare id sets, never order. The scope cases index three more
 *           documents (two scopes and a subtree) and pass for a driver whose `isolatesScopes` is true, whose isolation
 *           is the database's row-level security, covered by the RLS suite.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decisions 5 and 6); ADR 0221 (decisions 1, 7 and 9); ADR 0333 (amendment); ADR 0403; ADR 0404.
 */
import type { SearchDocument, SearchFacets } from "#contracts/index";
import type { SearchConformanceCase } from "#testing/search-conformance-case.type";

/** The mismatch of an id answer against the expected set; empty when equal. */
function sameIds(label: string, got: readonly string[], want: readonly string[]): string[] {
  const missed: string[] = [];
  if (new Set(got).size !== got.length)
    missed.push(`${label}: ids repeat in ${JSON.stringify(got)}`);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const expected = [...want].sort();
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const actual = [...new Set(got)].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    missed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  return missed;
}

/** A plain search with no filters over the first page. */
const page = (words: readonly string[]) => ({ words, filters: {}, offset: 0, limit: 10 });

/** Documents of scopes `platform.a` (and its child `platform.a.shop`) and `platform.b`, all matching "orbit". */
const SCOPED_DOCUMENTS = [
  {
    id: "s1",
    fields: ["orbit lamp"],
    filters: { color: ["red"] },
    scope: { id: "scp_a", path: "platform.a" },
  },
  {
    id: "s2",
    fields: ["orbit chair"],
    filters: { color: ["red"] },
    scope: { id: "scp_a_shop", path: "platform.a.shop" },
  },
  {
    id: "s3",
    fields: ["orbit desk"],
    filters: { color: ["blue"] },
    scope: { id: "scp_b", path: "platform.b" },
  },
] as const satisfies readonly SearchDocument[];

/** Every case, in run order. */
export const SEARCH_CONFORMANCE_CASES: readonly SearchConformanceCase[] = [
  {
    id: "search.every-word",
    run: async (driver, table) =>
      sameIds("linen shirt", await driver.search(table, page(["linen", "shirt"])), ["p1", "p3"]),
  },
  {
    id: "search.prefix",
    run: async (driver, table) =>
      sameIds("lin", await driver.search(table, page(["lin"])), ["p1", "p3", "p4"]),
  },
  {
    id: "search.alternatives",
    run: async (driver, table) =>
      sameIds(
        "chemise (or shirt)",
        await driver.search(table, { ...page(["chemise"]), alternatives: { chemise: ["shirt"] } }),
        ["p1", "p2", "p3"],
      ),
  },
  {
    id: "search.filters",
    run: async (driver, table) => [
      ...sameIds(
        "shirt, color blue",
        await driver.search(table, { ...page(["shirt"]), filters: { color: "blue" } }),
        ["p3"],
      ),
      ...sameIds(
        "summer, size l",
        await driver.search(table, { ...page(["summer"]), filters: { size: "l" } }),
        ["p1", "p4"],
      ),
    ],
  },
  {
    id: "search.slice",
    run: async (driver, table) => {
      const first = await driver.search(table, { ...page(["shirt"]), limit: 1 });
      const rest = await driver.search(table, { ...page(["shirt"]), offset: 1 });
      const missed: string[] = [];
      if (first.length !== 1) missed.push(`limit 1: expected one id, got ${JSON.stringify(first)}`);
      if (rest.length !== 2) missed.push(`offset 1: expected two ids, got ${JSON.stringify(rest)}`);
      return [...missed, ...sameIds("both pages", [...first, ...rest], ["p1", "p2", "p3"])];
    },
  },
  {
    id: "facets.counts",
    run: async (driver, table) => {
      const want: SearchFacets = { color: { white: 2, blue: 1 } };
      const got = await driver.facets(table, {
        words: ["shirt"],
        filters: {},
        paths: ["color"],
        limit: 10,
      });
      return JSON.stringify(got) === JSON.stringify(want)
        ? []
        : [`facets shirt by color: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`];
    },
  },
  {
    id: "facets.browse",
    run: async (driver, table) => {
      const want: SearchFacets = { color: { white: 2 } };
      const got = await driver.facets(table, {
        words: [],
        filters: {},
        paths: ["color"],
        limit: 1,
      });
      return JSON.stringify(got) === JSON.stringify(want)
        ? []
        : [
            `facets with no words, limit 1: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`,
          ];
    },
  },
  {
    id: "index.replaces",
    run: async (driver, table) => {
      await driver.index(table, [
        { id: "p2", fields: ["white cotton polo"], filters: { color: ["white"] } },
      ]);
      return [
        ...sameIds("shirt after re-index", await driver.search(table, page(["shirt"])), [
          "p1",
          "p3",
        ]),
        ...sameIds("polo after re-index", await driver.search(table, page(["polo"])), ["p2"]),
      ];
    },
  },
  {
    id: "remove.forgets",
    run: async (driver, table) => {
      await driver.remove(table, ["p1", "p9"]);
      return sameIds("shirt after removal", await driver.search(table, page(["shirt"])), [
        "p2",
        "p3",
      ]);
    },
  },
  {
    id: "visibility.refused",
    run: async (driver, table, options) => {
      if (options.appliesVisibility === true) return [];
      const visible = { sql: "select id from t", params: [] };
      const missed: string[] = [];
      for (const [label, call] of [
        ["search", () => driver.search(table, { ...page(["shirt"]), visible })],
        [
          "facets",
          () =>
            driver.facets(table, {
              words: ["shirt"],
              filters: {},
              paths: ["color"],
              limit: 10,
              visible,
            }),
        ],
      ] as const)
        try {
          await call();
          missed.push(`${label}: a request carrying visibility was answered, not refused`);
        } catch {
          // refused, as the port asks of an engine that cannot apply it
        }
      return missed;
    },
  },
  {
    id: "scope.isolated",
    run: async (driver, table) => {
      if (driver.isolatesScopes) return [];
      await driver.index(table, SCOPED_DOCUMENTS);
      const orbit = page(["orbit"]);
      return [
        ...sameIds(
          "orbit in platform.a",
          await driver.search(table, { ...orbit, scopePaths: ["platform.a"] }),
          ["s1", "s2"],
        ),
        ...sameIds(
          "orbit in platform.b",
          await driver.search(table, { ...orbit, scopePaths: ["platform.b"] }),
          ["s3"],
        ),
        ...sameIds(
          "orbit with no scope granted",
          await driver.search(table, { ...orbit, scopePaths: [] }),
          [],
        ),
        ...sameIds(
          "shirt (unscoped rows) in platform.b",
          await driver.search(table, { ...page(["shirt"]), scopePaths: ["platform.b"] }),
          ["p1", "p2", "p3"],
        ),
      ];
    },
  },
  {
    id: "facets.scoped",
    run: async (driver, table) => {
      if (driver.isolatesScopes) return [];
      await driver.index(table, SCOPED_DOCUMENTS);
      const want: SearchFacets = { color: { blue: 1 } };
      const got = await driver.facets(table, {
        words: ["orbit"],
        filters: {},
        paths: ["color"],
        limit: 10,
        scopePaths: ["platform.b"],
      });
      return JSON.stringify(got) === JSON.stringify(want)
        ? []
        : [
            `facets orbit by color in platform.b: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`,
          ];
    },
  },
];
