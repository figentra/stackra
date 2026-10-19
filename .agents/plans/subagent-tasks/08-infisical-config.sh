#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 08: Infisical Config (.infisical.json)"
echo "=========================================="

# Project ID from the user's Infisical URL:
# https://eu.infisical.com/organizations/38c214a6-7663-4c72-822f-7065e840f371/projects/secret-management/dd4724f4-7b9a-46ae-a899-b34af2d626b2/overview
PROJECT_ID="dd4724f4-7b9a-46ae-a899-b34af2d626b2"

if [ -f .infisical.json ]; then
  echo ".infisical.json already exists:"
  cat .infisical.json
  echo ""
  echo "Verifying workspaceId matches..."
  if grep -q "$PROJECT_ID" .infisical.json; then
    echo "workspaceId already correct."
  else
    echo "WARNING: workspaceId differs from project URL. Review manually."
  fi
else
  cat > .infisical.json << JSON
{
  "workspaceId": "$PROJECT_ID",
  "defaultEnvironment": "dev",
  "gitBranchToEnvironmentMapping": {
    "main": "staging"
  },
  "domain": "https://eu.infisical.com"
}
JSON
  echo "Created .infisical.json:"
  cat .infisical.json
fi

echo ""
echo "=== Verify CLI is logged in (does NOT print secrets) ==="
if command -v infisical >/dev/null 2>&1; then
  infisical --version || true
  echo ""
  echo "=== Dry-run: list secret NAMES at /agents dev (names only, no values) ==="
  infisical secrets --path=/agents --env=dev 2>&1 | head -20 || echo "NOTE: run 'infisical login' if not authenticated."
else
  echo "infisical CLI not installed: brew install infisical/get-cli/infisical"
fi

echo ""
echo "Subagent 08 complete"
