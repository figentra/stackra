/**
 * Stackra file contract:
 * Purpose: proves the web ChartExport: a named menu button over the chart, and its CSV is the chart's data table read
 *          back (or `data` when given) with a byte-order mark, guarded against formula injection.
 * Boundary: jsdom; `downloadFile` is replaced so the blob is read instead of saved. PNG drawing needs a real canvas and
 *           is proven by the playground.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ChartExport } from "#react/chart-export/chart-export";
import { WordCloud } from "#react/word-cloud/word-cloud";

const saved = vi.hoisted(() => [] as { blob: Blob; name: string }[]);
vi.mock("#react/widget-frame/download-file.function", () => ({
  downloadFile: (blob: Blob, name: string) => saved.push({ blob, name }),
}));

/** The saved file: its first three bytes (the byte-order mark) and its text, which decoding strips the mark from. */
async function file(at: number) {
  const blob = saved[at]?.blob ?? new Blob();
  return {
    bom: [...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)],
    text: await blob.text(),
  };
}

beforeEach(() => {
  saved.length = 0;
});

/** Opens the menu and chooses the item named `name`. */
async function choose(name: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: "Download chart" }));
  const item = await screen.findByRole("menuitem", { name });
  await act(async () => {
    fireEvent.click(item);
  });
}

describe("ChartExport (web)", () => {
  it("downloads the chart's own table as CSV", async () => {
    render(
      <ChartExport fileName="mentions">
        <WordCloud label="Mentions" words={[{ text: "=fresh", value: 9 }]} />
      </ChartExport>,
    );
    await choose(/CSV/);
    expect(saved[0]?.name).toBe("mentions.csv");
    expect(await file(0)).toEqual({ bom: [0xef, 0xbb, 0xbf], text: "Word,Value\r\n'=fresh,9\r\n" });
  });

  it("prefers the raw data and offers only the formats asked for", async () => {
    render(
      <ChartExport
        fileName="sales"
        formats={["csv"]}
        data={{ head: ["Month", "Sales"], rows: [["Jan", 1200]] }}
      >
        <WordCloud label="Mentions" words={[{ text: "fresh", value: 9 }]} />
      </ChartExport>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Download chart" }));
    expect(await screen.findAllByRole("menuitem")).toHaveLength(1);
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: /CSV/ }));
    });
    expect((await file(0)).text).toBe("Month,Sales\r\nJan,1200\r\n");
  });
});
