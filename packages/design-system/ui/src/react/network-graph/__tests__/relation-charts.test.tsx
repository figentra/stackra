/**
 * Stackra file contract:
 * Purpose: proves the web network graph, tree diagram, word cloud and chord diagram: each is an image named by its
 *          label with its numbers in a captioned data table (links, nodes with their path, words by weight, flows),
 *          and draws one mark per node, word or group.
 * Boundary: jsdom (no ResizeObserver, so the plot keeps its fallback width); the geometry is proven by the core layout
 *           tests and the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";

import { ChordDiagram } from "#react/chord-diagram/chord-diagram";
import { NetworkGraph } from "#react/network-graph/network-graph";
import { TreeDiagram } from "#react/tree-diagram/tree-diagram";
import { WordCloud } from "#react/word-cloud/word-cloud";

/** The data table's rows as text. */
const rows = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .map((row) => row.textContent);

const NODES = [
  { key: "a", label: "Sara" },
  { key: "b", label: "Omar" },
  { key: "c", label: "Lina" },
];

describe("NetworkGraph (web)", () => {
  it("is a named image with a circle per node and its links in the table", () => {
    render(
      <NetworkGraph
        label="Team"
        nodes={NODES}
        links={[
          { source: "a", target: "b", value: 3 },
          { source: "b", target: "c" },
        ]}
      />,
    );
    const image = screen.getByRole("img", { name: "Team" });
    expect(image.querySelectorAll("circle")).toHaveLength(3);
    expect(image.querySelectorAll("line")).toHaveLength(2);
    expect(rows()).toEqual(["FromToValue", "SaraOmar3", "OmarLina1"]);
  });
});

describe("TreeDiagram (web)", () => {
  it("lists every node with its path and summed value", () => {
    render(
      <TreeDiagram
        label="Org"
        items={[
          {
            key: "ceo",
            label: "CEO",
            children: [
              { key: "ops", label: "Ops", value: 12 },
              { key: "tech", label: "Tech", value: 30 },
            ],
          },
        ]}
      />,
    );
    expect(rows()).toEqual(["CategoryValue", "CEO42", "CEO › Ops12", "CEO › Tech30"]);
    expect(screen.getByRole("img", { name: "Org" }).querySelectorAll("path")).toHaveLength(2);
  });
});

describe("WordCloud (web)", () => {
  it("draws each word and lists them heaviest first", () => {
    render(
      <WordCloud
        label="Mentions"
        words={[
          { text: "late", value: 4 },
          { text: "fresh", value: 9 },
        ]}
      />,
    );
    expect(rows()).toEqual(["WordValue", "fresh9", "late4"]);
    expect(screen.getByRole("img", { name: "Mentions" }).querySelectorAll("text")).toHaveLength(2);
  });
});

describe("ChordDiagram (web)", () => {
  it("draws an arc per group and a ribbon per flow, with the flows in the table", () => {
    render(
      <ChordDiagram
        label="Moves"
        nodes={NODES}
        links={[
          { source: "a", target: "b", value: 5 },
          { source: "c", target: "a", value: 2 },
        ]}
      />,
    );
    expect(rows()).toEqual(["FromToValue", "SaraOmar5", "LinaSara2"]);
    expect(screen.getByRole("img", { name: "Moves" }).querySelectorAll("path")).toHaveLength(5);
  });
});
