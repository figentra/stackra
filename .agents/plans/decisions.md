# Stackra Configuration Decisions

**Date:** 2026-10-19
**Decision:** Accept all default recommendations from enterprise questionnaire

## Confirmed Choices

### A. Project Management
- Tool: Linear
- Team: Solo developer + AI agents (tier-based: Haiku/Sonnet/Opus)
- Review: Single maintainer + automated gates (CODEOWNERS)

### B. Secrets & Environment
- System: Infisical
- Structure: `/agents` (local), `/ci` (CI/CD), `/services/backend`, `/apps/*`
- Enforcement: guard-bash + guard-paths hooks, zero .env files
- MCP secrets: Vault wrapper (mcp.sh)

### C. Licensed Packages
- HeroUI Pro: Infisical-injected token via mcp.sh
- Uniwind Pro: Infisical-injected token
- EAS secrets: Synced from Infisical
- Encore secrets: Synced from Infisical

### D. Code Host & CI/CD
- Platform: GitHub
- CI: GitHub Actions + OIDC + Turborepo remote cache
- Deployment:
  - Backend: Encore Cloud
  - Mobile: EAS Build/Submit/Update
  - Web: Vercel or Encore static

### E. Tooling
- Package manager: pnpm 12.6.0
- Build system: Turborepo 2.11.7
- Formatter: oxfmt 0.71.0
- Linter: oxlint 1.86.0
- Testing: vitest 5.0.3
- E2E: Playwright (P1)

### F. Mobile
- Framework: Expo SDK 57
- Navigation: React Navigation 7 + native tabs
- UI: HeroUI Native + Uniwind
- Build: EAS

### G. Backend
- Framework: Encore (independent services)
- Database: PostgreSQL + MikroORM
- Secrets: encore.secret() + Infisical

### H. Security
- Supply chain: SHA pinning, SBOM, zizmor
- Tenant isolation: RLS + isolation tests (P1)
- Secret scanner: gitleaks

### I. Agents
- Source: `.agents/` (+ sync script)
- Tiers: steward/executor/reviewer/guardian/lead
- Hooks: guard-bash, guard-paths, post-write-checks, session-context
- Plugin: sdlc for generic agents

### J. Third-Party Tools
All 34 recommended tools accepted (see questionnaire Section K).

### K. Documentation
- Platform: Mintlify
- Port: All P0/P1 docs from docs-port-inventory plan

### L. Timeline
- Phase 1 (P0): Foundation - 1-2 days
- Phase 2 (P1): Core packages - 1-2 weeks
- Phase 3 (P1.5): Production readiness - 2-4 weeks
- Phase 4 (P2): Enhancement - ongoing

### M. Open Decisions
- Product strategy: Single product (flat services)
- Team expansion: Undecided (defer two-person gates)
- Payments: Stripe (MCP ready)
- I18n: English only MVP, add later (P2)
- Mobile release: Bi-weekly
- Data residency: No specific requirements
- Open source: All private (UNLICENSED)
- Brand: Use defaults (no brand yet)

**Status:** All defaults accepted. Execute Phase 1 immediately.
