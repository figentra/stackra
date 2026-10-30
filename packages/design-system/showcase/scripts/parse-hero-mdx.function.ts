/**
 * Stackra file contract:
 * Purpose: `parseHeroMdx`, the parser of one HeroUI component docs page: `## API Reference` part tables (react
 *          `### X Props`, native `### X`), render props, `#### <X>Animation`, `## Hooks` return tables, `## Styling >
 *          ### CSS Classes` lists (slots) and `## Accessibility` prose.
 * Boundary: a pure function over the MDX text; headings inside code fences do not count.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import { firstTable } from "./first-table.function.ts";
import type { HeroDoc } from "./hero-doc.type.ts";
import type { HeroPart } from "./hero-part.type.ts";
import type { HeroRow } from "./hero-row.type.ts";

interface Section {
  readonly level: number;
  readonly title: string;
  readonly lines: string[];
}

/** Splits MDX into heading sections. */
function sections(mdx: string): Section[] {
  let current: Section = { level: 0, title: "", lines: [] };
  const out: Section[] = [current];
  let isFenced = false;
  for (const line of mdx.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) isFenced = !isFenced;
    const heading = isFenced ? null : /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { level: heading[1]?.length ?? 0, title: heading[2] ?? "", lines: [] };
      out.push(current);
    } else {
      current.lines.push(line);
    }
  }
  return out;
}

/** Parses one HeroUI component MDX page. */
export function parseHeroMdx(
  mdx: string,
  meta: { slug: string; platform: "react" | "native"; source: string },
): HeroDoc {
  const parts: HeroPart[] = [];
  const hooks: { name: string; signature: string; returns: readonly HeroRow[] }[] = [];
  const slots: { name: string; description: string }[] = [];
  let a11y: string | undefined;
  let h2 = "";
  let h3 = "";
  for (const section of sections(mdx)) {
    if (section.level === 2) h2 = section.title;
    if (section.level === 3) h3 = section.title;
    const last = parts.at(-1);
    if (h2 === "API Reference" && section.level >= 3) {
      const rows = firstTable(section.lines);
      const title = section.title.replace(/\s+Props$/, "");
      if (rows.length === 0) continue;
      if (title.endsWith("RenderProps") && last) {
        // "TabsTriggerRenderProps" belongs to Tabs.Trigger; a bare "RenderProps" to the part above it
        const owner =
          parts.find((part) => `${part.name.replaceAll(".", "")}RenderProps` === title) ?? last;
        owner.renderProps = rows;
      } else if (section.level === 4 && title.endsWith("Animation") && last) {
        last.animation = rows;
      } else if (section.level === 3) {
        parts.push({ name: title, props: rows });
      }
    } else if (h2 === "Hooks" && section.level === 3) {
      const returns = /\*\*Returns:\*\*\s*`([^`]+)`/.exec(section.lines.join("\n"))?.[1];
      hooks.push({
        name: section.title,
        signature: `${section.title}()${returns ? `: ${returns}` : ""}`,
        returns: firstTable(section.lines),
      });
    } else if (h2 === "Hooks" && section.level === 4 && section.title === "Return Value") {
      const hook = hooks.at(-1);
      if (hook && hook.returns.length === 0) hook.returns = firstTable(section.lines);
    } else if (h2 === "Styling" && (h3 === "CSS Classes" || section.title === "CSS Classes")) {
      for (const line of section.lines) {
        const item = /^\s*[-*]\s+`([^`]+)`\s*(?:[-–—:]\s*)?(.*)$/.exec(line);
        if (item) slots.push({ name: item[1] ?? "", description: (item[2] ?? "").trim() });
      }
    } else if (h2 === "Accessibility") {
      const text = section.lines.join("\n").trim();
      const heading = section.level > 2 ? `${section.title}\n` : "";
      if (text) a11y = a11y ? `${a11y}\n\n${heading}${text}` : text;
    }
  }
  return { ...meta, parts, hooks, slots, ...(a11y ? { a11y } : {}) };
}
