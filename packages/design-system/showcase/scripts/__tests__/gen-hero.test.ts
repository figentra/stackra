/**
 * Stackra file contract:
 * Purpose: unit tests of `parseHeroMdx`, the HeroUI docs MDX parser behind `hero:import`.
 * Boundary: inline MDX samples shaped like HeroUI's react and native pages; no archive needed.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import { describe, expect, it } from "vitest";

import { firstTable } from "../first-table.function.ts";
import { parseHeroMdx } from "../parse-hero-mdx.function.ts";

const REACT = `---
title: Button
---

## Styling

### CSS Classes

#### Base
- \`.button\` - Base button styles
- \`.button--sm\` - Small size variant

## API Reference

### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`variant\` | \`'primary' \\| 'ghost'\` | \`'primary'\` | Visual style variant |
| \`onPress\` | \`(e: PressEvent) => void\` | - | Handler called when pressed |

### ButtonRenderProps

| Prop | Type | Description |
|------|------|-------------|
| \`isPressed\` | \`boolean\` | Whether the button is pressed |

## Accessibility

Built on React Aria.
`;

const NATIVE = `## API Reference

### Tabs

| prop | type | default | description |
| ---- | ---- | ------- | ----------- |
| \`value\` | \`string\` | - | Active tab |

\`\`\`tsx
### not a heading
\`\`\`

### Tabs.Indicator

| prop | type | default | description |
| ---- | ---- | ------- | ----------- |
| \`animation\` | \`TabsIndicatorAnimation\` | - | Animation |

#### TabsIndicatorAnimation

| prop | type | default | description |
| ---- | ---- | ------- | ----------- |
| \`width.type\` | \`'spring'\` | \`'spring'\` | Animation type |

## Hooks

### useTabs

**Returns:** \`UseTabsReturn\`

| property | type | description |
| -------- | ---- | ----------- |
| \`value\` | \`string\` | Active tab |

### useButton

#### Return Value

| property | type | description |
| -------- | ---- | ----------- |
| \`size\` | \`'sm' \\| 'md'\` | Size |
`;

describe("parseHeroMdx", () => {
  it("parses a react page: props, render props, CSS classes and accessibility", () => {
    const doc = parseHeroMdx(REACT, { slug: "button", platform: "react", source: "button.mdx" });
    expect(doc.parts).toHaveLength(1);
    expect(doc.parts[0]?.props[0]).toEqual({
      name: "variant",
      type: "'primary' | 'ghost'",
      default: "'primary'",
      description: "Visual style variant",
    });
    expect(doc.parts[0]?.props[1]?.default).toBeUndefined();
    expect(doc.parts[0]?.renderProps?.map((row) => row.name)).toEqual(["isPressed"]);
    expect(doc.slots).toEqual([
      { name: ".button", description: "Base button styles" },
      { name: ".button--sm", description: "Small size variant" },
    ]);
    expect(doc.a11y).toBe("Built on React Aria.");
  });

  it("parses a native page: parts, animation tables, hooks; ignores fenced headings", () => {
    const doc = parseHeroMdx(NATIVE, { slug: "tabs", platform: "native", source: "tabs.mdx" });
    expect(doc.parts.map((part) => part.name)).toEqual(["Tabs", "Tabs.Indicator"]);
    expect(doc.parts[1]?.animation?.[0]?.name).toBe("width.type");
    expect(doc.hooks.map((hook) => hook.signature)).toEqual([
      "useTabs(): UseTabsReturn",
      "useButton()",
    ]);
    expect(doc.hooks[1]?.returns[0]).toMatchObject({ name: "size", type: "'sm' | 'md'" });
  });

  it("returns no rows when there is no table", () => {
    expect(firstTable(["no table here"])).toEqual([]);
  });
});
