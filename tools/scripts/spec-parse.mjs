#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the spec parser, re-exported from `@figentra-oss/flow/parse` for anything that imported it here.
 * Boundary: no logic of its own; Figentra Flow (@figentra-oss/flow) holds it and its tests.
 * Runtime: node
 * Governing contract: ADR 0503 (Figentra Flow runs the development workflow); STA-1729 (W2).
 * Secrets: none.
 */
export * from "@figentra-oss/flow/parse";
