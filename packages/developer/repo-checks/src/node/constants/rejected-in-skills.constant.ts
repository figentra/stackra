/**
 * Stackra file contract:
 * Purpose: `REJECTED_IN_SKILLS`, the rejected or not-built technology a vendored or house skill must not teach (ADR 0227,
 *          the "Not built yet" rule), each as the narrow pattern that finds its code form: "express" and "sanity" are
 *          English words, so only their code forms match.
 * Boundary: data only; `checkSkillTech` reads it. Moved from core's agents-sync script (STA-2098 H6).
 * Runtime: isomorphic
 * Governing contract: ADR 0227; ADR 0258 (decision 6).
 */

/** Technology a skill must not teach, and how to find it. */
export const REJECTED_IN_SKILLS: Readonly<Record<string, RegExp>> = Object.freeze({
  drizzle: /\bdrizzle\b/i,
  prisma: /\bprisma\b/i,
  typeorm: /\btypeorm\b/i,
  knex: /\bknex\b/i,
  nestjs: /@nestjs\/|\bnestjs\b|\bnest\.js\b/i,
  "reflect-metadata": /reflect-metadata/,
  "encore.dev": /encore\.dev|~encore\//,
  "expo-router": /expo-router/,
  nextjs: /\bnext\.js\b|\bnextjs\b|from ["']next[/"']/i,
  jest: /\bjest\b/i,
  eslint: /\beslint\b/i,
  prettier: /\bprettier\b/i,
  zustand: /\bzustand\b/i,
  "@tanstack/store": /@tanstack\/store/,
  i18next: /\bi18next\b/i,
  "class-validator": /class-validator|class-transformer/,
  express: /from ["']express["']|\bexpress\(\)/,
  fastify: /\bfastify\b/i,
  sanity: /@sanity\/|sanity studio|sanity\.config/i,
  tauri: /\btauri\b/i,
  "better-auth": /better-auth|\bbetter auth\b/i, // superseded by ZITADEL (ADR 0206)
  xstate: /\bxstate\b/i, // @stackra/state-machine instead (ADR 0161)
  storybook: /\bstorybook\b|\.stories\./i, // no Storybook (ADR 0128)
  graphql: /\bgraphql\b/i, // MCP first plus REST, no GraphQL (ADR 0217)
  "spec-files": /\.spec\.[cm]?[jt]sx?\b/, // tests are __tests__/<name>.test.ts with a tier infix (ADR 0022, 0182)
  "root-tests-folder": /(?:^|[\s"'`(])\.?\/?tests\/(?!.*__tests__)/m, // no root tests/ (ADR 0022)
});
