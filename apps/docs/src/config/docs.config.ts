/**
 * Stackra file contract:
 * Purpose: the site configuration of @figentra/docs, the Stackra docs: name, theme, colours, logo and favicon, the tabs
 *          and their navigation groups, and the Mintlify keys gen does not own (`raw`). Gen renders
 *          `.stackra/site/docs.json` from it; it replaces the hand-written `src/docs.json`.
 * Boundary: data only (field initializers); gen imports the file and reads the fields of the one exported class.
 *           Logo and favicon are paths under `src/assets`; a page is its path under `src/docs` without the extension,
 *           and `{ folder }` lists every page of one folder (`adr` keeps every ADR at `/adr/<file>`).
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decisions 3 and 4); stackra-177 (STA-1317); STA-1575
 *                     (the customer tab and the /licensing redirect).
 */
import { DocsConfig } from "@stackra/gen";

/** The Stackra docs site. */
export class StackraDocsConfig extends DocsConfig {
  /** The site name in the header and the browser title. */
  override readonly name = "Stackra";

  /** The site description search engines and link previews show. */
  override readonly description =
    "Stackra — the @stackra/* packages, apps and services, and how to work in the monorepo.";

  /** The brand colours: primary on light, light on dark, and the accent (Stackra steel-500, 3:1 or better on both backgrounds). */
  override readonly colors = { primary: "#0B0D0F", light: "#F5F6F3", dark: "#647384" };

  /** The light and dark logos, paths under src/assets, linking home. */
  override readonly logo = { light: "logo/light.svg", dark: "logo/dark.svg", href: "/" };

  /** The favicon, a path under src/assets. */
  override readonly favicon = "favicon.svg";

  /** The tabs and their page groups; a page is its path under src/docs without the extension. */
  override readonly navigation = [
    {
      tab: "Guides",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "book-open",
      groups: [
        { group: "Get started", pages: ["index", "roadmap", "quickstart", "development"] },
        {
          group: "Monorepo",
          pages: [
            "guides/structure",
            "guides/packages",
            "guides/tooling",
            "guides/workflow",
            "guides/definition-of-done",
            "guides/scaffolding",
            "guides/standards",
            "guides/catalogs",
            "guides/testing",
            "guides/architecture-map",
          ],
        },
        { group: "Build", pages: [{ folder: "build" }] },
      ],
    },
    {
      tab: "For customers",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "briefcase",
      groups: [
        {
          group: "Use Stackra",
          pages: [
            "customers/install",
            "customers/support",
            "customers/security",
            "customers/residency",
            "customers/changelog",
            "customers/packages",
          ],
        },
      ],
    },
    {
      tab: "Constitution",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "shield",
      groups: [
        {
          group: "Laws",
          pages: [
            "constitution/index",
            "constitution/boundaries",
            "constitution/secrets",
            "constitution/http-and-events",
            "constitution/security",
            "constitution/tenancy",
            "constitution/delegation",
          ],
        },
      ],
    },
    {
      tab: "Architecture",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "landmark",
      // `adr/index` first, then every ADR by number (and the template), each at `/adr/<file>`.
      groups: [{ group: "Decisions", pages: [{ folder: "adr" }] }],
    },
    {
      tab: "Standards",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "check-circle",
      groups: [
        {
          group: "Rules",
          pages: [
            "standards/members",
            "standards/packages",
            "standards/structure",
            "standards/services",
            "standards/apps",
            "standards/code-style",
            "standards/testing",
            "standards/testing-by-kind",
            "standards/dependencies",
            "standards/i18n-rtl",
            "standards/ui-and-accessibility",
          ],
        },
      ],
    },
    {
      tab: "Runbooks",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "zap",
      groups: [
        {
          group: "Operations",
          pages: [
            "runbooks/setup",
            "runbooks/secrets",
            "runbooks/github-identities",
            "runbooks/ci",
            "runbooks/release",
            "runbooks/mobile-release",
            "runbooks/renovate",
            "runbooks/deploys",
            "runbooks/runway",
            "runbooks/upgrade",
            "runbooks/fresh-machine",
          ],
        },
      ],
    },
    {
      tab: "Agents",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "cpu",
      groups: [
        {
          group: "Setup",
          pages: [
            "agents/index",
            "agents/roster",
            "agents/hooks",
            "agents/skills",
            "agents/plugins",
            "agents/spec-lifecycle",
            "agents/concurrent-sessions",
            "agents/rules-that-dont-rot",
          ],
        },
      ],
    },
    {
      tab: "Writing docs",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "pen-line",
      groups: [
        {
          group: "Authoring",
          pages: [
            "writing/markdown",
            "writing/code",
            "writing/images",
            "writing/components",
            "writing/navigation",
            "writing/reusable-snippets",
            "writing/settings",
          ],
        },
        { group: "Brand", pages: ["brand"] },
      ],
    },
  ];

  /** The Mintlify keys gen does not model (background, fonts, appearance, search, SEO and the like), copied into docs.json as they are. */
  override readonly raw = {
    background: { color: { light: "#F5F6F3", dark: "#0B0D0F" } },
    fonts: { family: "Geist" },
    appearance: { default: "system", strict: false },
    icons: { library: "lucide" },
    styling: { eyebrows: "section", codeblocks: "system" },
    search: { prompt: "Search the Stackra docs" },
    seo: { indexing: "navigable", metatags: { "og:site_name": "Stackra" } },
    contextual: { options: ["copy", "view", "chatgpt", "claude"] },
    // The registry points `npm login` at /licensing (workers/registry wrangler.jsonc REGISTRY_LICENCE_DOCS_URL).
    redirects: [{ source: "/licensing", destination: "/customers/install" }],
    errors: {
      "404": {
        redirect: false,
        title: "Page not found",
        description: "This page moved or never existed. Try search.",
      },
    },
  };
}
