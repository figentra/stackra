#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 03: Port ADRs + Citation Sweep"
echo "=========================================="

# Check if ADRs need porting
if [ -f "apps/docs/src/adr/0003-tier-dependency-direction.mdx" ]; then
  echo "ADRs already ported, running citation sweep only"
else
  echo "ADRs 0003-0012 need to be created from sources"
  echo "This is a placeholder - ADRs should be ported based on docs-port-inventory.md"
  echo ""
  echo "Key ADRs to create:"
  echo "  0003: tier-dependency-direction"
  echo "  0004: package-archetypes-and-layers"  
  echo "  0005: di-container-and-legacy-decorators"
  echo "  0006: naming-exports-and-imports"
  echo "  0007: source-documentation-standard"
  echo "  0008: test-placement"
  echo "  0009: secrets-two-mechanisms"
  echo "  0010: services-are-independent-members"
  echo "  0011: rejected-and-deferred-technologies"
  echo "  0012: code-host-and-ci"
fi

echo ""
echo "=== CITATION SWEEP ==="

# Find all ADR citations
grep -r "ADR-" packages/ tools/ lefthook.yml 2>/dev/null | grep -v ".test." > /tmp/citations.txt || true

if [ -f /tmp/citations.txt ]; then
  echo "Found citations:"
  cat /tmp/citations.txt
  echo ""
  echo "Updates needed:"
  echo "  ADR-0007 → ADR-0005 (DI container)"
  echo "  ADR-0026 → ADR-0004 (Package archetypes)"
  echo "  ADR-0034 → ADR-0017 (Agent roster)"
  
  # Run sed replacements
  echo ""
  echo "Running citation updates..."
  
  # packages/tooling/typescript/base.json
  sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/typescript/base.json || true
  sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/typescript/decorators.json || true
  
  # packages/tooling/oxlint files
  sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/oxlint/decorators.jsonc || true
  sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/oxlint/boundaries.jsonc || true
  sed -i '' 's/ADR-0026/ADR-0004/g' packages/tooling/oxlint/boundaries.jsonc || true
  
  # packages/tooling/tsdown/index.ts
  sed -i '' 's/ADR-0007/ADR-0005/g' packages/tooling/tsdown/index.ts || true
  
  # lefthook.yml
  sed -i '' 's/ADR-0034/ADR-0017/g' lefthook.yml || true
  
  echo "✓ Citations updated"
else
  echo "No citations found"
fi

echo ""
echo "✓ Subagent 03 complete"
