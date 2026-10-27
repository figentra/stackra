/**
 * Stackra file contract:
 * Purpose: the site configuration of @figentra/{{NAME}}: name, theme, colours, logo and favicon, the tabs and their
 *          navigation groups, and the Mintlify keys gen does not own (`raw`). Gen renders `.stackra/site/docs.json`
 *          from it; there is no hand-written docs.json.
 * Boundary: data only (field initializers); gen imports the file and reads the fields of the one exported class.
 *           Logo and favicon are paths under `src/assets`; a page is its path under `src/docs` without the extension.
 * Runtime: node (read by gen at build time)
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decisions 3 and 4).
 */
import { DocsConfig } from "@stackra/gen";

/** The {{TITLE}} docs site. */
export class {{PASCAL}}DocsConfig extends DocsConfig {
  override readonly name = "{{TITLE}}";

  override readonly description = "{{DESCRIPTION}}";

  override readonly colors = { primary: "#0B0D0F", light: "#F5F6F3", dark: "#0B0D0F" };

  override readonly logo = { light: "logo/light.svg", dark: "logo/dark.svg", href: "/" };

  override readonly favicon = "favicon.svg";

  override readonly navigation = [
    {
      tab: "Guides",
      icon: "book-open",
      groups: [{ group: "Get started", pages: ["index", "quickstart"] }],
    },
  ];

  override readonly raw = {
    background: { color: { light: "#F5F6F3", dark: "#0B0D0F" } },
    fonts: { family: "Geist" },
    appearance: { default: "system", strict: false },
    icons: { library: "lucide" },
    styling: { eyebrows: "section", codeblocks: "system" },
    search: { prompt: "Search the {{TITLE}} docs" },
    seo: { indexing: "navigable", metatags: { "og:site_name": "{{TITLE}}" } },
    contextual: { options: ["copy", "view", "chatgpt", "claude"] },
    errors: {
      "404": {
        redirect: false,
        title: "Page not found",
        description: "This page moved or never existed. Try search.",
      },
    },
  };
}
