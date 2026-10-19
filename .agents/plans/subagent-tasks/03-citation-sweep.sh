#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 03: ADR Citation Sweep"
echo "=========================================="
echo ""
echo "ADR map (Stackra reality, ADRs 0001-0021 all exist):"
echo "  ADR-0007 (DI container)     -> ADR-0005"
echo "  ADR-0026 (archetypes)       -> ADR-0004"
echo "  ADR-0034 (agent roster)     -> ADR-0017"
echo "  Basalt ADR-0004             -> ADR-0004"
echo "  Basalt ADR-0029             -> ADR-0004 (superseded)"
echo "  .gitlab-ci.yml comment      -> GitHub Actions workflow"
echo ""

# --- packages/tooling/typescript/base.json ---
sed -i '' 's/(ADR-0007)/(ADR-0005)/g' packages/tooling/typescript/base.json
sed -i '' 's/(ADR-0007)/(ADR-0005)/g' packages/tooling/typescript/decorators.json

# --- packages/tooling/oxlint/decorators.jsonc ---
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/oxlint/decorators.jsonc

# --- packages/tooling/oxlint/boundaries.jsonc ---
# Handle the combined citation first: "ADR-0026 §1, Basalt ADR-0004/0029" -> "ADR-0004 §1"
sed -i '' 's/(ADR-0026 §1, Basalt ADR-0004\/0029)/(ADR-0004 §1)/g' packages/tooling/oxlint/boundaries.jsonc
sed -i '' 's/ADR-0026 §1/ADR-0004 §1/g' packages/tooling/oxlint/boundaries.jsonc
sed -i '' 's/(Basalt ADR-0029)/(ADR-0004)/g' packages/tooling/oxlint/boundaries.jsonc
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/oxlint/boundaries.jsonc

# --- packages/tooling/tsdown/index.ts ---
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/tsdown/index.ts

# --- packages/tooling/vitest ---
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/vitest/README.md
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/vitest/preset-decorators.ts
sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/vitest/src/__tests__/presets.test.ts

# --- lefthook.yml ---
sed -i '' 's/ADR-0034/ADR-0017/g' lefthook.yml
sed -i '' 's|\.gitlab-ci\.yml is the gate|the GitHub Actions Quality Gate workflow (.github/workflows/ci.yml) is the gate|g' lefthook.yml

echo "=== VERIFY: remaining bad citations ==="
REMAINING=$(grep -rn "ADR-0007\b\|ADR-0026\|ADR-0034\|Basalt ADR\|gitlab-ci" packages/ tools/ lefthook.yml 2>/dev/null | grep -v node_modules || true)
if [ -n "$REMAINING" ]; then
  echo "STILL FOUND:"
  echo "$REMAINING"
  exit 1
else
  echo "Clean - no stale citations remain."
fi

echo ""
echo "Subagent 03 complete"
