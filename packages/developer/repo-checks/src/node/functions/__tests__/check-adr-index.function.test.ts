/**
 * Stackra file contract:
 * Purpose: unit tests of `checkAdrIndex`: a consistent index and register pass and a repository without ADR pages is
 *          not checked; a page without a row, a row without a page, a second row, a row linking another slug, a row
 *          whose status differs from the page (including the superseding number), a page without a status, a missing
 *          index, and register entries that are reserved or external with a page, live without a page, of another
 *          status than the page or outside the vocabulary are findings.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-2851; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkAdrIndex } from "#node/functions/check-adr-index.function";

const ADR = "apps/docs/src/docs/adr/";
const INDEX = `${ADR}index.mdx`;
const REGISTER = "apps/docs/adr/numbers.yaml";

/** An ADR page whose description states `status`. */
const page = (name: string, status: string) => ({
  path: `${ADR}${name}.mdx`,
  text: `---\ntitle: "${name}"\ndescription: "${status} · 2026-10-19"\n---\n\nBody.\n`,
});

/** An index with the given rows, under the table head. */
const index = (...rows: string[]) =>
  ["# ADRs", "", "| ADR | Decision | Status |", "| --- | --- | --- |", ...rows, ""].join("\n");

const PAGES = [
  page("0001-first", "Accepted"),
  page("0002-second", "Superseded by 0003"),
  page("0003-third", "Proposed"),
];
const ROWS = [
  "| [0001](/adr/0001-first) | First, with an escaped \\| pipe | Accepted, amended by 0003 |",
  "| [0002](/adr/0002-second) | Second | Superseded by 0003 |",
  "| [0003](/adr/0003-third) | Third | Proposed; amended 2026-10-24 (STA-1) |",
];
const NUMBERS = [
  '"0001":\n  slug: first\n  status: accepted',
  '"0002":\n  slug: second\n  status: superseded',
  '"0003":\n  slug: third\n  status: proposed',
  '"0004":\n  slug: fourth\n  status: reserved\n  issue: STA-4',
  '"0005":\n  slug: elsewhere\n  status: external\n  home: another product',
  "",
].join("\n");

describe("checkAdrIndex", () => {
  it("accepts a consistent index and register and ignores other files", () => {
    const files = [...PAGES, { path: INDEX, text: "" }, { path: "README.md", text: "" }];
    expect(checkAdrIndex(files, index(...ROWS), NUMBERS)).toEqual([]);
    expect(checkAdrIndex(PAGES, index(...ROWS), undefined)).toEqual([]);
  });

  it("does not check a repository without ADR pages", () => {
    expect(checkAdrIndex([{ path: INDEX, text: "" }], undefined, undefined)).toEqual([]);
  });

  it("reports a page without a row and a missing index", () => {
    expect(checkAdrIndex(PAGES, index(ROWS[0] ?? "", ROWS[2] ?? ""), undefined)).toEqual([
      `${ADR}0002-second.mdx: no row in ${INDEX} (ADR template)`,
    ]);
    expect(checkAdrIndex(PAGES, undefined, undefined)).toEqual([
      `${INDEX}: missing; every ADR page needs a row there (ADR template)`,
    ]);
  });

  it("reports a row without a page, a second row and a row linking another slug", () => {
    const rows = [...ROWS, "| [0009](/adr/0009-ghost) | Ghost | Accepted |", ROWS[0] ?? ""];
    expect(checkAdrIndex(PAGES, index(...rows), undefined)).toEqual([
      `${INDEX}:8: the row for ADR 0009 has no page`,
      `${INDEX}:9: a second row for ADR 0001`,
    ]);
    const renamed = "| [0001](/adr/0001-old-name) | First | Accepted |";
    expect(checkAdrIndex(PAGES, index(renamed, ROWS[1] ?? "", ROWS[2] ?? ""), undefined)).toEqual([
      `${INDEX}:5: the row links /adr/0001-old-name, but the page is /adr/0001-first`,
    ]);
  });

  it("reports a row whose status differs from the page, including the superseding number", () => {
    const rows = [
      "| [0001](/adr/0001-first) | First | Proposed |",
      "| [0002](/adr/0002-second) | Second | Superseded by 0001 |",
      "| [0003](/adr/0003-third) | Third | to be decided |",
    ];
    expect(checkAdrIndex(PAGES, index(...rows), undefined)).toEqual([
      `${INDEX}:5: the row for ADR 0001 says "Proposed", but the page says accepted`,
      `${INDEX}:6: the row for ADR 0002 says "Superseded by 0001", but the page says superseded by 0003`,
      `${INDEX}:7: the row for ADR 0003 says "to be decided", but the page says proposed`,
    ]);
  });

  it("reports a page whose description opens with no status", () => {
    const pages = [page("0001-first", "Accepted"), page("0002-second", "Draft")];
    const rows = [ROWS[0] ?? "", "| [0002](/adr/0002-second) | Second | Draft |"];
    expect(checkAdrIndex(pages, index(...rows), undefined)).toEqual([
      `${ADR}0002-second.mdx: the description does not open with a status (Accepted, Proposed, Deferred, Rejected or Superseded by NNNN; ADR template)`,
    ]);
  });

  it("reports register entries that disagree with the pages", () => {
    const pages = [...PAGES, page("0004-fourth", "Accepted"), page("0005-elsewhere", "Proposed")];
    const rows = [
      ...ROWS,
      "| [0004](/adr/0004-fourth) | Fourth | Accepted |",
      "| [0005](/adr/0005-elsewhere) | Elsewhere | Proposed |",
    ];
    expect(checkAdrIndex(pages, index(...rows), NUMBERS)).toEqual([
      `${REGISTER}: 0004 is reserved, but ${ADR}0004-fourth.mdx exists; set status: accepted`,
      `${REGISTER}: 0005 is external, but ${ADR}0005-elsewhere.mdx exists; set status: proposed`,
    ]);
    const stale = [
      NUMBERS.replace("slug: first\n  status: accepted", "slug: first\n  status: proposed"),
      '"0006":\n  slug: gone\n  status: accepted\n',
      '"0007":\n  slug: odd\n  status: draft\n',
    ].join("");
    expect(checkAdrIndex(PAGES, index(...ROWS), stale)).toEqual([
      `${REGISTER}: 0001 is proposed, but ${ADR}0001-first.mdx says accepted`,
      `${REGISTER}: 0006 is accepted, but there is no page ${ADR}0006-gone.mdx`,
      `${REGISTER}: 0007 has status "draft"; use one of reserved, external, proposed, accepted, deferred, rejected, superseded`,
    ]);
  });

  it("leaves a register that does not parse to checkAdrNumbers", () => {
    expect(checkAdrIndex(PAGES, index(...ROWS), `${NUMBERS}"0001":\n  slug: again\n`)).toEqual([]);
  });
});
