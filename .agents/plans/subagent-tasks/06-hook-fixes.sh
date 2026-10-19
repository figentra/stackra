#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 06: Hook Fixes"
echo "=========================================="
echo ""
echo "Verified state (orchestrator pre-check):"
echo "  - guard-bash.mjs: infisical/encore/wrangler/.env rules all present"
echo "  - guard-paths.mjs: .env/secret-names/pnpm-lock/dist/mobile/generated-agent-dirs all present"
echo "  - session-context.mjs: Stackra-specific, correct ADR path (apps/docs/src/adr)"
echo "  Only remaining fix: delete context-health.mjs (dead code; reads unset CLAUDE_TOOL_CALL_COUNT)"
echo ""

if [ -f .agents/hooks/context-health.mjs ]; then
  rm .agents/hooks/context-health.mjs
  echo "Deleted .agents/hooks/context-health.mjs"
else
  echo "context-health.mjs already absent"
fi

if [ -f .agents/hooks/context-health.test.mjs ]; then
  rm .agents/hooks/context-health.test.mjs
  echo "Deleted .agents/hooks/context-health.test.mjs"
else
  echo "context-health.test.mjs already absent"
fi

# Verify no settings file references the deleted hook
echo ""
echo "=== Check for dangling references ==="
grep -rn "context-health" .claude/settings.json opencode.jsonc .agents/hooks/ 2>/dev/null || echo "No references to context-health remain."

echo ""
echo "Subagent 06 complete"
