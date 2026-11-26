/**
 * Stackra file contract:
 * Purpose: the site configuration of @figentra/docs, the Stackra docs: name, theme, colours, logo and favicon, the tabs
 *          and their navigation groups, and the paths that moved (`redirects`). Gen renders the Fumadocs site in
 *          `.stackra/site/` from it (ADR 0514, STA-2026).
 * Boundary: data only (field initializers); gen imports the file and reads the fields of the one exported class.
 *           Logo and favicon are paths under `src/assets`; a page is its path under `src/docs` without the extension,
 *           and `{ folder }` lists every page of one folder (`adr` keeps every ADR at `/adr/<file>`).
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decisions 3 and 4); stackra-177 (STA-1317); STA-1575
 *                     (the customer tab and the /licensing redirect); ADR 0514; STA-2026.
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

  /**
   * The site's languages: English is the source; an Arabic page sits beside its English page as `<page>.ar.mdx` and
   * is served under `/ar/` (STA-2676). Every Arabic page is a native draft for Qossai's review; a page without one
   * falls back to English.
   */
  override readonly locales = [
    { code: "en", label: "English", default: true },
    { code: "ar", label: "العربية", dir: "rtl" as const },
  ];

  /** The tabs and their page groups; a page is its path under src/docs without the extension. */
  override readonly navigation = [
    {
      tab: "Guides",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
      icon: "book-open",
      groups: [
        { group: "Get started", pages: ["index", "roadmap", "quickstart", "development"] },
        {
          // The framework in eight pages (STA-2676): the model, actions, clients and tools, the design system,
          // experience documents, Runway, the CLI and where the API reference comes from.
          group: "The framework",
          pages: [
            "programming-model",
            "actions",
            "clients-and-tools",
            "design-system",
            "experience",
            "runway",
            "cli",
            "api",
          ],
        },
        {
          group: "Monorepo",
          pages: [
            "guides/structure",
            "guides/packages",
            "guides/tooling",
            "guides/workflow",
            "guides/definition-of-done",
            "guides/scaffolding",
            "guides/console",
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
      icon: "landmark",
      // `adr/index` first, then every ADR by number (and the template), each at `/adr/<file>`.
      groups: [{ group: "Decisions", pages: [{ folder: "adr" }] }],
    },
    {
      tab: "Standards",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
      icon: "zap",
      groups: [
        {
          group: "Operations",
          pages: [
            "runbooks/setup",
            "runbooks/secrets",
            "runbooks/token-rotation",
            "runbooks/cross-app-event-relay",
            "runbooks/github-identities",
            "runbooks/ci",
            "runbooks/release",
            "runbooks/mobile-release",
            "runbooks/mobile-onboarding",
            "runbooks/renovate",
            "runbooks/deploys",
            "runbooks/monitoring",
            "runbooks/restore-drill",
            "runbooks/test-infrastructure",
            "runbooks/runway",
            "runbooks/upgrade",
            "runbooks/fresh-machine",
          ],
        },
        {
          group: "Runway commands",
          pages: [
            "runway/plan",
            "runway/deploy",
            "runway/promote",
            "runway/rollback",
            "runway/status",
            "runway/validate",
            "runway/drift",
            "runway/secrets-sync",
            "runway/secrets-decrypt",
            "runway/env-check",
            "runway/env-orphans",
            "runway/evidence",
          ],
        },
      ],
    },
    {
      tab: "Agents",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Lucide icon name for the site navigation, not a Stackra icon key
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

  /** Paths that moved; the site writes them to `_redirects`. The registry points `npm login` at /licensing. */
  override readonly redirects = [{ from: "/licensing", to: "/customers/install" }];
}
