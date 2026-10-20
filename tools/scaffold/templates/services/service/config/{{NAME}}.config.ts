/**
 * Stackra file contract:
 * Purpose: deploy-time defaults of @figentra/service-{{NAME}} (CF1). Layered at boot: these defaults → host file →
 *          env file → `STACKRA_<PKG>__<PATH>` env vars → runway.yaml overrides (CF3). Config never varies per
 *          tenant; per-tenant values are settings (CF4). Secrets appear only as `secret("Name")` references.
 * Owner: the service owner · Secrets: references only
 */

// shortcut: a plain object until @stackra/config ships defineConfig<Schema>() with Zod validation (STA-77).
export const {{PASCAL}}Config = {} as const;
