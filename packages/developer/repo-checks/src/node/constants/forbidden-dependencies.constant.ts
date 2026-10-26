/**
 * Stackra file contract:
 * Purpose: `FORBIDDEN_DEPENDENCIES`, the packages no member may depend on: architecture decisions enforced at the manifest
 *          level, each with the ADR that replaced it.
 * Boundary: data only; `checkMember` reads it.
 * Runtime: node
 * Governing contract: .agents/rules/not-built-yet.md; ADR 0011 and the ADRs named on each entry.
 */

/** Architecture decisions enforced at the manifest level (.agents/rules/not-built-yet.md, ADR 0011 and the ADRs named). */
export const FORBIDDEN_DEPENDENCIES: readonly string[] = [
  "eslint",
  "prettier",
  "jest",
  "@nestjs/core",
  "@nestjs/common",
  "reflect-metadata",
  "prisma",
  "@prisma/client",
  "drizzle-orm",
  "express",
  "fastify",
  "typeorm",
  "knex",
  "next", // 0165: Next.js is rejected (no revival trigger); web is Vite with React Router 7
  "expo-router", // 0011, 0061: code-based React Navigation
  "zustand", // 0079: client state is @stackra/state
  "@tanstack/store", // 0079
  "i18next", // 0080: the ported @stackra/i18n
  "react-i18next", // 0080
  "class-validator", // 0095: @stackra/validation on Zod
  "class-transformer", // 0095
  "meilisearch", // 0089: search engines are Pro drivers (stackra-pro), Postgres first here
  "@opensearch-project/opensearch", // 0089
];
