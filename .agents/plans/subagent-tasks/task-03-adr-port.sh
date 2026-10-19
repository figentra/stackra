#!/bin/bash
cd /Users/akouta/Projects/final-project

echo "=== ANALYZING ADR CITATIONS ==="

# Find all ADR citations that need updating
echo "Searching for ADR citations in codebase..."
grep -r "ADR-" packages/ tools/ lefthook.yml apps/ 2>/dev/null | grep -v ".test." | grep -v "node_modules" > .agents/plans/adr-citations-found.txt || true

echo "Found citations:"
cat .agents/plans/adr-citations-found.txt || echo "No citations found"

echo ""
echo "=== ADR RENUMBER MAP ==="
echo "ADR-0007 (DI container) → Will be ADR-0005"
echo "ADR-0026 (Package archetypes) → Will be ADR-0004"  
echo "ADR-0034 (Agent roster) → Will be ADR-0017"
echo "Basalt ADR-0004 → Stackra ADR-0004"
echo "Basalt ADR-0029 → Superseded by ADR-0004"
echo ""
echo "Run citation sweep AFTER porting ADRs"
