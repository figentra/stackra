/**
 * Stackra file contract:
 * Purpose: `SKILL_TECH_ALLOWED`, the upstream skills that mention a rejected technology only as a generic example, each
 *          with why that is acceptable. Vendored skills are never edited in place, so the exception lives here.
 * Boundary: data only; `checkSkillTech` reads it. Encore skills are not listed: they are fenced in
 *           `.agents/reference/encore`, which is never scanned. Moved from core's agents-sync script (STA-2098 H6).
 * Runtime: isomorphic
 * Governing contract: ADR 0227; ADR 0258 (decision 6).
 */

/** Skill name, then technology, then the reason it may mention it. */
export const SKILL_TECH_ALLOWED: Readonly<Record<string, Readonly<Record<string, string>>>> =
  Object.freeze({
    "backend-gen-and-encore-target": {
      "encore.dev":
        "house skill on the generated target; names what a member must never contain (ADR 0124)",
    },
    "expo-animation": {
      "expo-router": "upstream Expo skill; Stackra mobile uses React Navigation (ADR 0061)",
    },
    "expo-data-fetching": {
      "expo-router": "upstream Expo skill; loaders do not apply, React Navigation (ADR 0061)",
    },
    "expo-design-system": { "expo-router": "upstream Expo skill; React Navigation (ADR 0061)" },
    "expo-upgrade": { "expo-router": "upstream Expo upgrade notes; React Navigation (ADR 0061)" },
    "heroui-react": {
      nextjs: "framework setup examples; the web stack is Vite and React Router 7 (ADR 0165)",
    },
    "eas-app-stores": { graphql: "a warning against private EAS GraphQL queries" },
    "playwright-best-practices": {
      nextjs: "generic web-server examples",
      storybook: "component-testing notes; no Storybook here (ADR 0128)",
      graphql: "API-mocking examples; no GraphQL here (ADR 0217)",
      "spec-files": "upstream naming; tests are __tests__/<name>.e2e.ts here (ADR 0022, 0182)",
      "root-tests-folder": "upstream layout; no root tests/ here (ADR 0022)",
      prisma: "generic seeding example",
      zustand: "generic state example",
    },
    pnpm: { eslint: "generic examples; oxlint here", prettier: "generic examples; oxfmt here" },
    "react-native-best-practices": { zustand: "generic state example", eslint: "generic examples" },
    resend: { nextjs: "framework examples; Resend sits behind the mail driver (ADR 0191)" },
    tdd: { jest: "Jest-style API names; vitest here" },
    turborepo: {
      nextjs: "example app names",
      eslint: "example task names",
      jest: "example task names",
      prettier: "example task names",
      graphql: "example package names",
      "root-tests-folder": "example inputs globs",
    },
    vitest: {
      jest: "Jest-compatible API notes",
      "spec-files": "default include globs; tests are __tests__/<name>.test.ts here (ADR 0022)",
      "root-tests-folder": "config examples; no root tests/ here (ADR 0022)",
    },
  });
