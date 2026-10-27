/**
 * Stackra file contract:
 * Purpose: the root module of @stackra/tokens. A host imports it to load the package; gen finds every binding in
 *          the module groups beside it by its base class and writes the wiring, so it lists no providers.
 * Boundary: declares the module and the modules it imports; no logic.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12, decisions 13 and 16); ADR 0263 (generated wiring).
 */
import { Module } from "@stackra/container";

/** The root module of @stackra/tokens; its key is the package name without its scope, in snake_case. */
export class TokensModule extends Module({ imports: [] }) {}
