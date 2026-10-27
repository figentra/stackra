/**
 * Stackra file contract:
 * Purpose: the root module of @figentra/playground. Gen finds it by name, collects the routes under `src/routes/` and
 *          writes the browser entry that mounts them (`.stackra/entry/browser.ts`, ADR 0295 decision 7).
 * Boundary: declares the root module and the modules it imports; no providers and no routes of its own.
 * Runtime: browser
 * Governing contract: ADR 0294 (rule R12, decisions 14, 16 and 25); ADR 0295 (decisions 7 and 10).
 */
import { Module } from "@stackra/container";

/** The root module of the playground app; package modules it uses join `imports`. */
export class PlaygroundModule extends Module({ imports: [] }) {}
