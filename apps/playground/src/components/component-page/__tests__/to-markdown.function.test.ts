/**
 * Stackra file contract:
 * Purpose: proves `toMarkdown` writes HeroUI-shaped MDX: frontmatter, Import, Usage with code, Anatomy, the example
 *          headings, the Styling list and one GFM table per part with pipes escaped and no Default column for render
 *          props.
 * Boundary: the pure function only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (Copy Markdown); ADR 0022.
 */
import { toMarkdown } from "#src/components/component-page/to-markdown.function";

const WORDS = {
  import: "Import",
  usage: "Usage",
  anatomy: "Anatomy",
  styling: "Styling",
  api: "API Reference",
  propsOf: (part: string) => `${part} Props`,
  renderProps: "Render props",
  prop: "Prop",
  type: "Type",
  default: "Default",
  description: "Description",
};

describe("toMarkdown", () => {
  it("writes the HeroUI section order with tables per part", () => {
    const md = toMarkdown({
      title: "Button",
      description: "Triggers an action.",
      importLine: 'import { Button } from "@stackra/ui/react";',
      anatomy: "<Button>\n  <Button.Label />\n</Button>",
      examples: [
        { title: "Variants", code: "export default function Variants() {}\n" },
        { title: "States" },
      ],
      parts: [
        {
          name: "Button",
          props: [
            {
              name: "variant",
              type: '"primary" | "secondary"',
              default: "primary",
              required: false,
              description: "The emphasis.",
              source: "stackra",
            },
          ],
          renderProps: [
            {
              name: "isPressed",
              type: "boolean",
              required: true,
              description: "Down.",
              source: "react-aria",
            },
          ],
        },
      ],
      slots: [{ name: ".button", description: "Base" }],
      words: WORDS,
    });
    expect(md).toContain('---\ntitle: "Button"\ndescription: "Triggers an action."\n---');
    expect(md.indexOf("## Import")).toBeLessThan(md.indexOf("### Usage"));
    expect(md.indexOf("### Usage")).toBeLessThan(md.indexOf("### Anatomy"));
    expect(md.indexOf("### Anatomy")).toBeLessThan(md.indexOf("### States"));
    expect(md.indexOf("## Styling")).toBeLessThan(md.indexOf("## API Reference"));
    expect(md).toContain("- `.button`: Base");
    expect(md).toContain("| Prop | Type | Default | Description |");
    expect(md).toContain('| `variant` | `"primary" \\| "secondary"` | `primary` | The emphasis. |');
    expect(md).toContain("### Button Render props\n\n| Prop | Type | Description |");
    expect(md).toContain("| `isPressed`* | `boolean` | Down. |");
  });
});
