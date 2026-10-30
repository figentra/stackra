/**
 * Stackra file contract:
 * Purpose: proves every web free example the registry declares has its demo (`demos/free/<slug>/<id>.tsx`), that each
 *          demo renders on its own with no props and draws something, that each free demo catalogue has an Arabic
 *          message for every English key with the same ICU arguments' names, and that a demo reads its words from the
 *          catalogue (plurals included), not from code.
 * Boundary: jsdom with real HeroUI inside a memory router, the DesignSystemProvider and the playground's icons (some
 *           demos read the location or the scheme). `matchMedia`, `ResizeObserver` and `IntersectionObserver` are
 *           stubbed because jsdom has none. Words are read without an i18n provider, so they are English.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 and 10 (WP6a acceptance); ADR 0403 (catalogue
 *                     completeness); ADR 0022 (test placement).
 */
import { COMPONENTS } from "@stackra/showcase";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { MemoryRouter } from "react-router";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { PlaygroundIcons } from "#src/components/playground-icons";

/** Every free demo module, by its glob key `../free/<slug>/<id>.tsx`. */
const DEMOS = import.meta.glob<{ readonly default: ComponentType }>("../free/*/*.tsx", {
  eager: true,
});

/** Every catalogue of the app, by locale and namespace (the file name). */
const FILES = import.meta.glob<Record<string, unknown>>("../../../assets/lang/*/*.json", {
  eager: true,
  import: "default",
});

/** The catalogue of `namespace` in `locale`, read raw (no English fallback merged in). */
const catalogue = (locale: string, namespace: string) =>
  FILES[`../../../assets/lang/${locale}/${namespace}.json`];

/** The namespace of a free demo folder: its name in snake case (`icon` is `icon_page`, as `icon` names a prop). */
const namespaceOf = (slug: string) => (slug === "icon" ? "icon_page" : slug.replaceAll("-", "_"));

/** The demo folders, except Button and Tabs, whose words live with their route. */
const SLUGS = [...new Set(Object.keys(DEMOS).map((key) => key.split("/")[2] ?? ""))].filter(
  (slug) => slug !== "button" && slug !== "tabs",
);

/** Every leaf of a catalogue with its message. */
const leaves = (node: unknown, prefix = ""): [string, string][] =>
  typeof node === "object" && node !== null
    ? Object.entries(node).flatMap(([key, value]) => leaves(value, `${prefix}${key}.`))
    : [[prefix.slice(0, -1), String(node)]];

/** The names of a message's ICU arguments, branch words and literal text aside. */
const argumentsOf = (message: string) => {
  // A brace opens an argument at the top or inside a branch, and a branch inside an argument (`none {none}`).
  const names = new Set<string>();
  const open: ("argument" | "branch")[] = [];
  [...message].forEach((character, index) => {
    if (character === "{") {
      const isArgument = open.length === 0 || open.at(-1) === "branch";
      if (isArgument) names.add(/^\s*(\w+)/.exec(message.slice(index + 1))?.[1] ?? "");
      open.push(isArgument ? "argument" : "branch");
    } else if (character === "}") open.pop();
  });
  return [...names].sort();
};

/** Renders a demo the way the component page does. */
const renderDemo = (Demo: ComponentType) =>
  render(
    <MemoryRouter>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <Demo />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );

describe("web free demos", () => {
  beforeEach(() => {
    stubBrowserApis();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}

        takeRecords() {
          return [];
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("has a demo for every free web example of the registry", () => {
    const missing = COMPONENTS.filter(
      ({ tier, platforms }) => tier === "free" && platforms.includes("react"),
    )
      .flatMap((entry) =>
        entry.examples
          .filter((example) => (example.platforms ?? entry.platforms).includes("react"))
          .map((example) => `../free/${entry.slug}/${example.id}.tsx`),
      )
      .filter((key) => !(key in DEMOS));
    expect(missing).toEqual([]);
  });

  it.each(Object.entries(DEMOS))("renders %s", (_, module) => {
    const Demo = module.default;
    const { container } = renderDemo(Demo);
    expect(container.firstChild).not.toBeNull();
  });

  it("has an Arabic message with the same arguments for every free demo key", () => {
    expect(SLUGS.length).toBeGreaterThan(60);
    for (const slug of SLUGS) {
      const namespace = namespaceOf(slug);
      const english = catalogue("en", namespace);
      const arabic = catalogue("ar", namespace);
      expect(english, `en ${namespace}`).toBeDefined();
      expect(arabic, `ar ${namespace}`).toBeDefined();
      const arabicByPath = new Map(leaves(arabic));
      for (const [path, message] of leaves(english)) {
        const translated = arabicByPath.get(path);
        expect(translated, `${namespace}::${path}`).toBeDefined();
        expect(argumentsOf(translated ?? ""), `${namespace}::${path}`).toEqual(
          argumentsOf(message),
        );
      }
    }
  });

  it("reads its words, plurals included, from the catalogue", () => {
    const Live = DEMOS["../free/badge/control.tsx"]?.default;
    if (Live === undefined) throw new Error("the badge control demo is missing");
    renderDemo(Live);
    expect(screen.getByText("Pressed 0 times.")).toBeTruthy();
    const press = screen.getAllByRole("button")[0];
    if (press === undefined) throw new Error("the badge control demo has no button");
    act(() => fireEvent.click(press));
    expect(screen.getByText("Pressed 1 time.")).toBeTruthy();
  });
});
