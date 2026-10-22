#!/usr/bin/env node
/**
 * UserPromptSubmit: one-line reminders keyed on what the prompt is about. Cheap, never blocks.
 * Each hint points at the rule file that owns the topic so the agent reads the source instead
 * of trusting the one-liner.
 */
import { readStdin, context, failOpen } from "./_io.mjs";

const EVENT = "UserPromptSubmit";

async function main() {
  const input = await readStdin();
  const p = String(input.prompt ?? input.user_input ?? "").toLowerCase();
  const hints = [];
  const has = (...ws) => ws.some((w) => p.includes(w));

  if (has("endpoint", "route", " api", "handler", "controller"))
    hints.push(
      "HTTP: services are plain TypeScript; behaviour is an action or query class (`extends Action({ key })`, `extends Query({ key })`), gen derives the route from the key and generates Encore (ADR 0091/0124/0294), never hand-written; input and output are the types of `handle` and gen compiles the Zod; authenticated by default; cursor pagination on lists; prefixed public ids; typed `Refusal` errors; Idempotency-Key on writes (.agents/rules/http-conventions.md).",
    );
  if (has("secret", "api key", "token", "credential", ".env", "infisical"))
    hints.push(
      'Secrets: Infisical is the source of every value (ADR 0173); runway syncs app secrets into Encore `secret("NAME")`, Workers and EAS on deploy. Dev and MCP tokens reach a process only through the pnpm script or tools/scripts/mcp.sh that needs them; raw `infisical run` asks the owner. No .env files, never read or print a value (.agents/rules/secrets.md).',
    );
  if (has("adr", "decision", "architecture decision", "supersede"))
    hints.push(
      "Decisions are ADRs: `apps/docs/src/adr/NNNN-slug.mdx` from `template.mdx` (next number = highest on disk + 1), index row in `adr/index.mdx` and nav in `src/docs.json`, same-commit supersession. Route the writing to docs-adr-steward; ADR 0011 lists rejected/deferred tech.",
    );
  if (has("changeset", "changelog", "version bump", "release"))
    hints.push(
      "Release: one changeset per consumer-visible member change (`.changeset/<slug>.md`, `@stackra/<member>` + bump); never run `changeset version` locally (guard-bash denies it) and never hand-edit CHANGELOG.md (apps/docs/src/runbooks/release.mdx, ADR-0013).",
    );
  if (has("test", "vitest", ".spec", "spec file", "spec.ts"))
    hints.push(
      "Tests sit directly in a `__tests__/` folder beside their subject (`src/**/__tests__/<name>.test.ts`), anywhere in the repo; no root `tests/`, no `.spec` (ADR-0022, enforced by `pnpm validate`).",
    );
  if (has("package", "dependency", "version", "catalog", "pnpm-workspace"))
    hints.push(
      "Versions come only from catalogs in `pnpm-workspace.yaml` (`catalog:<name>`, exact pins) or `workspace:*` — never a literal version or range in a package.json (.agents/rules/versions.md).",
    );
  if (has("service", "microservice", "encore service", "worker", "gateway"))
    hints.push(
      "Services are independent workspace members under `services/` (`@figentra/service-<name>`), never importing each other or apps (ADR-0010). A member authors `stackra.config.ts` and one root module `src/<key>.module.ts`; gen writes the entry (ADR 0294/0295), though today's services still have an authored `src/main.ts` until they are converted (.agents/rules/service-checklist.md). Check `.agents/rules/not-built-yet.md` before introducing a framework or runtime.",
    );
  if (has("component", "screen", "page", "button", "design token", "brand"))
    hints.push(
      "Frontend: brand tokens live in `@stackra/brand` (packages/experience/brand); web uses HeroUI v3, mobile HeroUI Native + Uniwind; share types/state/i18n/tokens across web and native, never components (not-built-yet.md).",
    );
  if (has("prisma", "drizzle", "typeorm", "knex", "orm", "migration", "database"))
    hints.push(
      "Data: MikroORM is the ORM (ADR-0014); Prisma/Drizzle/TypeORM/Knex are rejected and blocked by `pnpm validate`. One database per service; the service owns its schema.",
    );
  if (has("where should", "which package", "placement", "new package", "boundary"))
    hints.push(
      "Placement: deployed → tier:app/tier:service; shared → tier:lib under `packages/<category>/`; build config → tier:config in `packages/tooling/`; script → `tools/scripts/`. Dependency direction config → lib → app → service, never upstream (.agents/rules/workspace-layout.md, module-boundary.md).",
    );
  if (has("import", "barrel", "export"))
    hints.push(
      "Boundaries: a package never imports an app, a service, `encore.dev`, or another package's `src/`; barrels name each re-export and declare nothing (enforced by `turbo boundaries` and oxlint boundaries.jsonc).",
    );

  if (
    /\b(new feature|feature request|i want (to|you to)|add support|implement|build (a|an|the)|let'?s build)\b/.test(
      p,
    ) &&
    !p.includes("speckit")
  )
    hints.push(
      "Feature work starts with spec-kit, not code: `/speckit.specify`, then `/speckit.clarify` (Impact questionnaire, Linear STA-n), then `/speckit.plan`. Specs live in `.agents/specs/sta-<n>-<slug>/`; `/speckit.plan` refuses until clarifications are complete (apps/docs/src/agents/spec-lifecycle.mdx).",
    );

  if (hints.length) context(EVENT, "[STACKRA HINTS]\n- " + hints.join("\n- "));
}

await failOpen(main);
