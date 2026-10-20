/**
 * Stackra file contract:
 * Purpose: publishable deploy-time defaults of @stackra/{{NAME}} (CF1). `stackra config:publish {{NAME}}` copies
 *          this file into a host, which overrides it in layers (CF3). Config never varies per tenant; per-tenant
 *          values are settings (CF4). Secrets appear only as `secret("Name")` references.
 * Owner: the package owner · Secrets: references only
 */

// shortcut: a plain object until @stackra/config ships defineConfig<Schema>() with Zod validation (STA-77).
export const {{PASCAL}}Config = {} as const;
