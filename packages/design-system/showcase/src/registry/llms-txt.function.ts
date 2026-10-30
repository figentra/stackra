/**
 * Stackra file contract:
 * Purpose: `llmsTxt`, the `llms.txt` of a showcase build (llmstxt.org): a title, the one-line summary, then per category a
 *          list of its built components, each a link to its page with its description and doc-page headline, in the
 *          catalogue's language.
 * Boundary: a pure function over the registry and one parsed catalogue; the build writes the file.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave: copy-as-markdown and llms.txt, 2026-10-28).
 */
import { ComponentCategory } from "#src/enums/component-category.enum";
import { categoryKeys } from "#src/registry/category-keys.function";
import { componentKeys } from "#src/registry/component-keys.function";
import { docKeys } from "#src/registry/doc-keys.function";
import { lookupMessage } from "#src/registry/lookup-message.function";
import { webPath } from "#src/registry/web-path.function";
import type { LlmsTxtInput } from "#src/types/llms-txt-input.type";

/** The llms.txt text. */
export function llmsTxt({ entries, catalogue, baseUrl, title, summary }: LlmsTxtInput): string {
  const say = (key: string) => lookupMessage(catalogue, key) ?? "";
  const base = baseUrl.replace(/\/$/, "");
  const lines = [`# ${title}`, "", `> ${summary}`];
  for (const category of ComponentCategory) {
    const built = entries.filter(
      (entry) => entry.category === category && entry.status !== "planned",
    );
    if (built.length === 0) continue;
    lines.push("", `## ${say(categoryKeys(category).title)}`, "");
    for (const entry of built) {
      const keys = componentKeys(entry);
      const headline = say(docKeys(entry).fields.headline);
      const note = [say(keys.description), headline].filter(Boolean).join(" ");
      lines.push(`- [${say(keys.title)}](${base}${webPath(entry)}): ${note}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
