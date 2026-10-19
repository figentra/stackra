#!/bin/bash
set -e

cd /Users/akouta/Projects/final-project

echo "=========================================="
echo "SUBAGENT 04: Infisical Setup"
echo "=========================================="

if [ -f ".infisical.json" ]; then
  echo ".infisical.json already exists"
  cat .infisical.json
else
  echo "Creating .infisical.json template..."
  echo ""
  echo "⚠️  MANUAL STEP REQUIRED:"
  echo ""
  echo "1. Install Infisical CLI:"
  echo "   brew install infisical"
  echo ""
  echo "2. Create workspace at https://app.infisical.com"
  echo ""
  echo "3. Get workspace ID from workspace settings"
  echo ""
  echo "4. Create .infisical.json:"
  cat << 'TEMPLATE'
{
  "workspaceId": "<YOUR_WORKSPACE_ID>",
  "defaultEnvironment": "dev",
  "gitBranchToEnvironmentMapping": {
    "main": "staging"
  },
  "domain": "https://eu.infisical.com"
}
TEMPLATE
  echo ""
  echo "5. Create vault structure in Infisical UI:"
  echo "   - /agents (dev tokens)"
  echo "   - /ci (staging|prod)"
  echo "   - /services/backend (dev|staging|prod)"
  echo ""
  echo "6. Add required secrets to /agents:"
  echo "   - HEROUI_PERSONAL_TOKEN"
  echo "   - GITHUB_PERSONAL_ACCESS_TOKEN"
  echo "   - STRIPE_SECRET_KEY (optional)"
  echo "   - CONTEXT7_API_KEY"
  echo "   - RESEND_API_KEY (optional)"
fi

echo ""
echo "✓ Subagent 04 complete"
