# @figentra/service-health

Health service. For now it is an entry, `src/main.ts`, that prints a greeting, and a root module,
`src/health.module.ts` (`HealthModule`), that `package.json` names in `stackra.module` for the generator (ADR 0090).
Feature modules join its `imports` once `@stackra/container` ships `@Module`. Plain TypeScript: no Encore file here
(ADR 0124); see [`services/`](../README.md) for the rules.

| Command                                        | Does                                    |
| ---------------------------------------------- | --------------------------------------- |
| `pnpm dev`                                     | Run `src/main.ts` and restart on change |
| `pnpm start`                                   | Run `src/main.ts` once                  |
| `pnpm build`                                   | Bundle to `dist/` with tsdown           |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                        |
