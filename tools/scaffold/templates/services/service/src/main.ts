/**
 * Stackra file contract:
 * Purpose: process entry of @figentra/service-{{NAME}} — bootstraps the root module. The deployed runtime is the
 *          Encore app `stackra gen` writes to `.stackra/encore` (ADRs 0091, 0124); no Encore import and no handler
 *          live here.
 * Owner: the service owner · Secrets: forbidden
 */
import { {{PASCAL}}Module } from "./{{NAME}}.module";

// shortcut: @stackra/container is not built yet (STA-76), so the entry only names the root module. When it ships:
// `const app = await Container.create({{PASCAL}}Module); await app.init();`, and `app.close(signal)` on SIGTERM.
export const root = {{PASCAL}}Module;
