// generated from .agents/agents (reviewer: true) by tools/scripts/agents-sync.mjs — edit the sources, not this file
/** Agent types that may run `pnpm bot:review` (ADR 0230, ADR 0293); `guard-bash` denies every other caller. */
export const REVIEWER_AGENTS = new Set([
  "accessibility-reviewer",
  "architecture-guardian",
  "code-reviewer",
  "design-brand-reviewer",
  "security-tenancy-reviewer",
]);
